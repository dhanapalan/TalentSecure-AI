// =============================================================================
// TalentSecure AI — Exam Attempt Service
// =============================================================================
// CRUD + business logic for the exam_attempts and admin_audit_logs tables.
// =============================================================================

import { query, queryOne } from "../config/database.js";
import { ExamAttemptRow, AdminAuditLogRow, ExamAttemptStatus, AdminAuditAction } from "../types/index.js";
import { logger } from "../config/logger.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AutoSaveInput {
  student_id: string;
  exam_id: string;
  current_question_index: number;
  answers_payload: Record<string, unknown>;
}

export interface ResolveInterruptionInput {
  admin_id: string;
  student_id: string;
  exam_id: string;
  reason: string;
}

export interface ResolveInterruptionResult {
  action: "EXAM_RESUMED" | "EXAM_RESET";
  attempt: ExamAttemptRow;
  audit_log: AdminAuditLogRow;
}

// ── Interrupted Attempts (Admin) ─────────────────────────────────────────────

export interface InterruptedAttemptView {
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  exam_id: string;
  exam_title: string;
  current_question_index: number;
  started_at: Date;
  last_saved_at: Date;
}

/**
 * Returns all exam attempts with status = 'interrupted', joined with
 * user + exam data so the admin can see who and which exam.
 */
export async function listInterrupted(): Promise<InterruptedAttemptView[]> {
  const rows = await query<InterruptedAttemptView>(
    `SELECT
       ea.id               AS attempt_id,
       ea.student_id,
       u.name              AS student_name,
       u.email             AS student_email,
       ea.exam_id,
       e.title             AS exam_title,
       ea.current_question_index,
       ea.started_at,
       ea.last_saved_at
     FROM exam_attempts ea
     JOIN users u ON u.id = ea.student_id
     JOIN exams e ON e.id = ea.exam_id
     WHERE ea.status = 'interrupted'
     ORDER BY ea.last_saved_at DESC`,
  );
  return rows;
}

// ── Auto-Save (Student) ─────────────────────────────────────────────────────

/**
 * Upsert the student's current exam progress.
 *
 * Uses INSERT … ON CONFLICT to either create a new attempt or update
 * the existing one. Conflict key: (student_id, exam_id) where the
 * attempt is not yet completed / reset.
 *
 * For simplicity we match on the most recent non-terminal attempt.
 */
export async function autoSave(input: AutoSaveInput): Promise<ExamAttemptRow> {
  const { student_id, exam_id, current_question_index, answers_payload } = input;

  // Try to find an existing active attempt (in_progress or interrupted)
  const existing = await queryOne<ExamAttemptRow>(
    `SELECT * FROM exam_attempts
     WHERE student_id = $1
       AND exam_id = $2
       AND status IN ('in_progress', 'interrupted')
     ORDER BY started_at DESC
     LIMIT 1`,
    [student_id, exam_id],
  );

  if (existing) {
    // Update existing attempt
    const updated = await queryOne<ExamAttemptRow>(
      `UPDATE exam_attempts
       SET current_question_index = $1,
           saved_answers          = $2,
           last_saved_at          = NOW(),
           status                 = 'in_progress'
       WHERE id = $3
       RETURNING *`,
      [current_question_index, JSON.stringify(answers_payload), existing.id],
    );

    logger.info("Exam auto-save updated", {
      attemptId: existing.id,
      student_id,
      exam_id,
      questionIndex: current_question_index,
    });

    return updated!;
  }

  // No active attempt yet — create a new one
  const created = await queryOne<ExamAttemptRow>(
    `INSERT INTO exam_attempts
       (student_id, exam_id, status, current_question_index, saved_answers, last_saved_at)
     VALUES ($1, $2, 'in_progress', $3, $4, NOW())
     RETURNING *`,
    [student_id, exam_id, current_question_index, JSON.stringify(answers_payload)],
  );

  logger.info("Exam auto-save created new attempt", {
    attemptId: created!.id,
    student_id,
    exam_id,
  });

  return created!;
}

// ── Get attempt by student + exam ────────────────────────────────────────────

export async function getAttempt(
  studentId: string,
  examId: string,
): Promise<ExamAttemptRow | null> {
  return queryOne<ExamAttemptRow>(
    `SELECT * FROM exam_attempts
     WHERE student_id = $1 AND exam_id = $2
     ORDER BY started_at DESC
     LIMIT 1`,
    [studentId, examId],
  );
}

// ── Get active attempt (for resume on reconnect) ─────────────────────────────

export async function getActiveAttempt(
  studentId: string,
  examId: string,
): Promise<ExamAttemptRow | null> {
  return queryOne<ExamAttemptRow>(
    `SELECT * FROM exam_attempts
     WHERE student_id = $1
       AND exam_id = $2
       AND status IN ('in_progress', 'interrupted')
     ORDER BY started_at DESC
     LIMIT 1`,
    [studentId, examId],
  );
}

// ── Mark attempt as interrupted ──────────────────────────────────────────────

export async function markInterrupted(attemptId: string): Promise<ExamAttemptRow | null> {
  return queryOne<ExamAttemptRow>(
    `UPDATE exam_attempts
     SET status = 'interrupted', last_saved_at = NOW()
     WHERE id = $1 AND status = 'in_progress'
     RETURNING *`,
    [attemptId],
  );
}

// ── Mark attempt as completed ────────────────────────────────────────────────

export async function markCompleted(attemptId: string): Promise<ExamAttemptRow | null> {
  return queryOne<ExamAttemptRow>(
    `UPDATE exam_attempts
     SET status = 'completed', completed_at = NOW(), last_saved_at = NOW()
     WHERE id = $1 AND status IN ('in_progress', 'interrupted')
     RETURNING *`,
    [attemptId],
  );
}

// ── Resolve Interruption (Admin) ─────────────────────────────────────────────

/**
 * Admin resolves a student's interrupted exam attempt.
 *
 * Condition 1 (Resume): If saved_answers exists and is not empty →
 *   set status = 'in_progress', log EXAM_RESUMED.
 *
 * Condition 2 (Reset): If saved_answers is null / empty / invalid →
 *   clear answers, reset question index to 0, set status = 'reset',
 *   log EXAM_RESET.
 */
export async function resolveInterruption(
  input: ResolveInterruptionInput,
): Promise<ResolveInterruptionResult> {
  const { admin_id, student_id, exam_id, reason } = input;

  // 1. Fetch the student's most recent attempt
  const attempt = await queryOne<ExamAttemptRow>(
    `SELECT * FROM exam_attempts
     WHERE student_id = $1 AND exam_id = $2
     ORDER BY started_at DESC
     LIMIT 1`,
    [student_id, exam_id],
  );

  if (!attempt) {
    throw new Error("No exam attempt found for this student and exam");
  }

  // 2. Determine whether saved_answers has meaningful content
  const hasValidAnswers = isAnswersValid(attempt.saved_answers);

  let updatedAttempt: ExamAttemptRow;
  let action: AdminAuditAction;

  if (hasValidAnswers) {
    // ── Condition 1: Resume ──────────────────────────────────────────────
    action = "EXAM_RESUMED";
    updatedAttempt = (await queryOne<ExamAttemptRow>(
      `UPDATE exam_attempts
       SET status = 'in_progress', last_saved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [attempt.id],
    ))!;

    logger.info("Admin resumed exam attempt", {
      admin_id,
      student_id,
      exam_id,
      attemptId: attempt.id,
    });
  } else {
    // ── Condition 2: Reset ───────────────────────────────────────────────
    action = "EXAM_RESET";
    updatedAttempt = (await queryOne<ExamAttemptRow>(
      `UPDATE exam_attempts
       SET status                 = 'reset',
           saved_answers          = '{}'::jsonb,
           current_question_index = 0,
           last_saved_at          = NOW()
       WHERE id = $1
       RETURNING *`,
      [attempt.id],
    ))!;

    logger.info("Admin reset exam attempt", {
      admin_id,
      student_id,
      exam_id,
      attemptId: attempt.id,
    });
  }

  // 3. Write an immutable audit log entry
  const auditLog = (await queryOne<AdminAuditLogRow>(
    `INSERT INTO admin_audit_logs (admin_id, student_id, exam_id, action, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [admin_id, student_id, exam_id, action, reason],
  ))!;

  return { action, attempt: updatedAttempt, audit_log: auditLog };
}

// ── Private helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if `saved_answers` contains at least one key-value pair.
 * Treats null, undefined, non-objects, and empty objects as "no valid answers".
 */
function isAnswersValid(answers: unknown): boolean {
  if (!answers || typeof answers !== "object") return false;
  if (Array.isArray(answers)) return answers.length > 0;
  return Object.keys(answers as Record<string, unknown>).length > 0;
}
