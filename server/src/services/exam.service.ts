import { query, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";

export interface ExamRow {
  id: string;
  title: string;
  scheduled_at: Date;
  duration_minutes: number;
  total_questions: number;
  status: string;
  created_at: Date;
}

/**
 * List all exams ordered by scheduled time.
 */
export async function listExams() {
  return query<ExamRow>(
    "SELECT * FROM assessments ORDER BY scheduled_at DESC",
  );
}

/**
 * List active assessments with their violation counts.
 */
export async function listActiveExams() {
  return query<ExamRow & { violation_count: number }>(
    `SELECT a.*,
            COALESCE(v.cnt, 0)::int AS violation_count
     FROM   assessments a
     LEFT JOIN (
       SELECT ps.assessment_id, COUNT(*) AS cnt
       FROM   proctoring_violations pv
       JOIN   proctoring_sessions ps ON ps.id = pv.session_id
       GROUP  BY ps.assessment_id
     ) v ON v.assessment_id = a.id
     WHERE  a.status = 'IN_PROGRESS' OR a.status = 'SCHEDULED'
     ORDER  BY a.scheduled_at ASC`,
  );
}

/**
 * Get a single exam by ID.
 */
export async function getExamById(id: string) {
  return queryOne<ExamRow>(
    "SELECT * FROM assessments WHERE id = $1",
    [id],
  );
}

// ── Create Exam ──────────────────────────────────────────────────────────────

export interface CreateExamInput {
  title: string;
  total_questions: number;
  duration_minutes: number;
  created_by?: string | null;
  scheduled_at?: Date;
  status?: string;
}

export async function createExam(input: CreateExamInput) {
  const scheduledTime = input.scheduled_at ?? new Date();
  const status = input.status ?? 'SCHEDULED';

  // Fix: Need a default role_id since it's required in assessments table
  // Let's find any role or use a placeholder if we're just generating
  const role = await queryOne<{ id: string }>("SELECT id FROM roles LIMIT 1");
  const roleId = role?.id;

  if (!roleId) {
    throw new AppError("No roles found. Please create a role first.", 400);
  }

  return queryOne<ExamRow>(
    `INSERT INTO assessments
       (title, scheduled_at, duration_minutes, total_questions, total_marks, passing_percentage,
        role_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.title,
      scheduledTime,
      input.duration_minutes,
      input.total_questions,
      input.total_questions * 5, // assuming 5 marks per question
      60, // 60% passing default
      roleId,
      status
    ],
  );
}

/**
 * Assign an assessment to multiple campuses.
 */
export async function assignExamToCampuses(examId: string, campusIds: string[]) {
  for (const campusId of campusIds) {
    await query(
      `INSERT INTO assessment_campuses (assessment_id, campus_id)
       VALUES ($1, $2)
       ON CONFLICT (assessment_id, campus_id) DO NOTHING`,
      [examId, campusId]
    );
  }
}

// ── Management Features ──────────────────────────────────────────────────────

/**
 * Get live progress of an exam (students and their status)
 */
export async function getExamProgress(examId: string, campusId?: string) {
  let sql = `
        SELECT 
            sp.id as student_profile_id,
            sp.first_name,
            sp.last_name,
            sp.email,
            sp.campus_id,
            c.name as campus_name,
            ase.status as session_status,
            ase.id as session_id,
            ase.started_at,
            ase.completed_at,
            ase.score,
            (SELECT COUNT(*) FROM proctoring_violations pv 
             JOIN proctoring_sessions ps ON ps.id = pv.session_id 
             WHERE ps.assessment_id = $1 AND ps.student_id = sp.id) as violation_count
        FROM student_profiles sp
        JOIN campuses c ON c.id = sp.campus_id
        JOIN assessment_campuses ac ON ac.campus_id = sp.campus_id
        LEFT JOIN assessment_sessions ase ON ase.assessment_id = $1 AND ase.student_id = sp.id
        WHERE ac.assessment_id = $1
    `;

  const params: any[] = [examId];
  if (campusId) {
    sql += ` AND sp.campus_id = $2`;
    params.push(campusId);
  }

  return query(sql, params);
}

/**
 * Terminate the entire exam
 */
export async function terminateExam(examId: string) {
  // 1. Update assessment status
  await query("UPDATE assessments SET status = 'TERMINATED' WHERE id = $1", [examId]);

  // 2. Terminate all active sessions
  await query(
    "UPDATE assessment_sessions SET status = 'TERMINATED', completed_at = NOW() WHERE assessment_id = $1 AND status = 'IN_PROGRESS'",
    [examId]
  );
}

/**
 * Terminate a specific student session
 */
export async function terminateStudentSession(sessionId: string) {
  return query(
    "UPDATE assessment_sessions SET status = 'TERMINATED', completed_at = NOW() WHERE id = $1 RETURNING *",
    [sessionId]
  );
}

/**
 * Reset a student session (delete session and proctoring data)
 */
export async function resetStudentSession(sessionId: string) {
  const session = await queryOne<{ assessment_id: string, student_id: string }>(
    "SELECT assessment_id, student_id FROM assessment_sessions WHERE id = $1",
    [sessionId]
  );

  if (!session) return;

  // Delete violations and sessions
  await query(
    "DELETE FROM proctoring_violations WHERE session_id IN (SELECT id FROM proctoring_sessions WHERE assessment_id = $1 AND student_id = $2)",
    [session.assessment_id, session.student_id]
  );
  await query(
    "DELETE FROM proctoring_sessions WHERE assessment_id = $1 AND student_id = $2",
    [session.assessment_id, session.student_id]
  );
  await query("DELETE FROM assessment_sessions WHERE id = $1", [sessionId]);
}
