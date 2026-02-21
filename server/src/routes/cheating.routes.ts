import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize, authenticateService } from "../middleware/auth.js";
import * as cheatingController from "../controllers/cheating.controller.js";

const router = Router();

// ── Validation ───────────────────────────────────────────────────────────────

const VIOLATION_TYPES = [
  "face_not_detected",
  "multiple_faces",
  "face_mismatch",
  "tab_switch",
  "browser_minimized",
  "copy_paste_attempt",
  "right_click",
  "screen_share_detected",
  "devtools_open",
  "external_display",
  "network_anomaly",
] as const;

const cheatingLogSchema = z.object({
  student_id: z.string().uuid("student_id must be a valid UUID"),
  exam_id: z.string().uuid("exam_id must be a valid UUID"),
  violation_type: z.enum(VIOLATION_TYPES),
  risk_score: z.number().min(0).max(100),
  screenshot_url: z.string().url().optional(),
});

// ── Routes ───────────────────────────────────────────────────────────────────

// ── Validation: student self-report ──────────────────────────────────────────

const reportSchema = z.object({
  exam_id: z.string().uuid("exam_id must be a valid UUID"),
  violation_type: z.enum(VIOLATION_TYPES),
});

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/cheating-logs
 * List cheating logs (admin / college).
 */
router.get(
  "/",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "college", "college_admin"),
  cheatingController.listLogs,
);

/**
 * GET /api/cheating-logs/stats
 * Dashboard summary stats (admin / college).
 */
router.get(
  "/stats",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "cxo", "college", "college_admin"),
  cheatingController.stats,
);

/**
 * POST /api/cheating-logs
 * Called by the AI engine to record a proctoring violation.
 * Auth: x-api-key header with AI_ENGINE_API_KEY.
 */
router.post(
  "/",
  authenticateService,
  validate(cheatingLogSchema),
  cheatingController.createLog,
);

/**
 * POST /api/cheating-logs/report
 * Student self-reports a browser violation (JWT auth).
 */
router.post(
  "/report",
  authenticate,
  authorize("student"),
  validate(reportSchema),
  cheatingController.reportViolation,
);

export default router;
