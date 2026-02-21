// =============================================================================
// TalentSecure AI — Admin Routes
// =============================================================================
// Protected routes for admin-level operations (super_admin, admin, college_admin).
// Mounted at /api/admin
// =============================================================================

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import * as examAttemptController from "../controllers/examAttempt.controller.js";

const router = Router();

// ── Validation Schemas ───────────────────────────────────────────────────────

const resolveInterruptionSchema = z.object({
  student_id: z.string().uuid("student_id must be a valid UUID"),
  exam_id: z.string().uuid("exam_id must be a valid UUID"),
  reason: z.string().min(1, "A reason is required for audit purposes").max(2000),
});

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/exams/interrupted
 *
 * Returns exam attempts with status = 'interrupted' + student/exam metadata.
 */
router.get(
  "/exams/interrupted",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "college_admin"),
  examAttemptController.listInterrupted,
);

/**
 * POST /api/admin/exams/resolve-interruption
 *
 * Admin resolves a student's interrupted exam attempt:
 *   - If saved_answers exist → resume (status = 'in_progress', log EXAM_RESUMED)
 *   - If saved_answers empty → reset (clear data, log EXAM_RESET)
 *
 * Returns the action taken + the updated attempt + the audit log entry.
 */
router.post(
  "/exams/resolve-interruption",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "college_admin"),
  validate(resolveInterruptionSchema),
  examAttemptController.resolveInterruption,
);

export default router;
