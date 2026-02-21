// =============================================================================
// TalentSecure AI — Exam Attempt Controller
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as attemptService from "../services/examAttempt.service.js";
import { ApiResponse } from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";

// ── GET /api/admin/exams/interrupted ──────────────────────────────────────────
/**
 * Admin route — returns all exam attempts with status = 'interrupted',
 * enriched with student name / email and exam title.
 */
export const listInterrupted = async (
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const rows = await attemptService.listInterrupted();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/exams/auto-save ────────────────────────────────────────────────
/**
 * Student route — auto-save current exam progress.
 * Accepts exam_id, current_question_index, and answers_payload.
 * Upserts into exam_attempts and updates last_saved_at.
 */
export const autoSave = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) {
      throw new AppError("Authentication required", 401);
    }

    const { exam_id, current_question_index, answers_payload } = req.body;

    const attempt = await attemptService.autoSave({
      student_id: studentId,
      exam_id,
      current_question_index,
      answers_payload,
    });

    res.json({
      success: true,
      data: attempt,
      message: "Progress saved",
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/exams/:id/attempt ───────────────────────────────────────────────
/**
 * Student route — fetch the active attempt for a given exam (for resume).
 */
export const getActiveAttempt = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) {
      throw new AppError("Authentication required", 401);
    }

    const examId = req.params.id as string;
    const attempt = await attemptService.getActiveAttempt(studentId, examId);

    res.json({
      success: true,
      data: attempt,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/exams/resolve-interruption ───────────────────────────────
/**
 * Admin route — resolve a student's interrupted exam attempt.
 *
 * Condition 1 (Resume): saved_answers exists & is non-empty →
 *   status = 'in_progress', log EXAM_RESUMED.
 * Condition 2 (Reset): saved_answers is null / empty / invalid →
 *   clear answers, question_index = 0, status = 'reset', log EXAM_RESET.
 */
export const resolveInterruption = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      throw new AppError("Authentication required", 401);
    }

    const { student_id, exam_id, reason } = req.body;

    const result = await attemptService.resolveInterruption({
      admin_id: adminId,
      student_id,
      exam_id,
      reason,
    });

    res.json({
      success: true,
      data: {
        action: result.action,
        attempt: result.attempt,
        audit_log: result.audit_log,
      },
      message:
        result.action === "EXAM_RESUMED"
          ? "Exam resumed — student can continue from where they left off"
          : "Exam reset — student will start from the beginning",
    });
  } catch (err) {
    next(err);
  }
};
