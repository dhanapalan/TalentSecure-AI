import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import * as examController from "../controllers/exam.controller.js";
import * as examAttemptController from "../controllers/examAttempt.controller.js";

const router = Router();

// ── Validation Schemas ───────────────────────────────────────────────────────

const generateAssessmentSchema = z.object({
  categories: z
    .array(
      z.object({
        category: z.string().min(1),
        percentage: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .refine(
      (cats) => {
        const total = cats.reduce((s, c) => s + c.percentage, 0);
        return Math.abs(total - 100) < 0.5;
      },
      { message: "Category percentages must sum to 100%" },
    ),
  totalQuestions: z.number().int().min(5).max(200).optional().default(20),
  total_questions: z.number().int().min(5).max(200).optional(),
  duration_minutes: z.number().int().min(1).max(600).optional().default(60),
});

const executeCodeSchema = z.object({
  sourceCode: z.string().min(1, "Source code is required"),
  language: z.string().min(1, "Language is required"),
  stdin: z.string().optional().default(""),
});

const runTestsSchema = z.object({
  sourceCode: z.string().min(1, "Source code is required"),
  language: z.string().min(1, "Language is required"),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      }),
    )
    .min(1, "At least one test case is required"),
  timeLimitMs: z.number().int().min(1000).max(30000).optional().default(5000),
  memoryLimitKb: z.number().int().min(1024).max(524288).optional().default(262144),
});

const validateCodeSchema = z.object({
  sourceCode: z.string().min(1, "Source code is required"),
  language: z.string().min(1, "Language is required"),
  questionId: z.string().min(1, "Question ID is required"),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      }),
    )
    .min(1, "At least one test case is required"),
  timeLimitMs: z.number().int().min(1000).max(30000).optional().default(5000),
  memoryLimitKb: z.number().int().min(1024).max(524288).optional().default(262144),
});

const blueprintCuratorSchema = z.object({
  weights: z
    .record(
      z.string(),
      z.number().min(0).max(100),
    )
    .refine(
      (w) => {
        const total = Object.values(w).reduce((s, v) => s + v, 0);
        return Math.abs(total - 100) < 0.5;
      },
      { message: "Category weight percentages must sum to 100%" },
    )
    .refine(
      (w) => Object.keys(w).length >= 1,
      { message: "At least one category is required" },
    ),
  total_questions: z.number().int().min(1).max(200),
  duration_minutes: z.number().int().min(1).max(600).optional().default(60),
});

const generateDynamicSchema = z.object({
  weights: z
    .record(
      z.string().min(1, "Category name cannot be empty"),
      z.number().min(0).max(100),
    )
    .refine(
      (w) => Object.keys(w).length >= 1,
      { message: "At least one category weight is required" },
    )
    .refine(
      (w) => {
        const total = Object.values(w).reduce((s, v) => s + v, 0);
        return Math.abs(total - 100) < 0.5;
      },
      { message: "Category weight percentages must sum to 100%" },
    ),
  total_questions: z.number().int().min(1).max(200),
  duration_minutes: z.number().int().min(1).max(600).optional().default(60),
});

const nextAdaptiveSchema = z.object({
  category: z.string().min(1, "Category is required"),
  current_difficulty: z.enum(["easy", "medium", "hard"]),
  answered_correctly: z.boolean(),
  seen_question_ids: z.array(z.string().uuid()).optional().default([]),
});

const autoSaveSchema = z.object({
  exam_id: z.string().uuid("exam_id must be a valid UUID"),
  current_question_index: z.number().int().min(0),
  answers_payload: z.record(z.string(), z.unknown()).default({}),
});

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/exams              — all exams
 * GET /api/exams/active       — active exams with violation counts
 * GET /api/exams/languages    — supported languages for code execution
 * GET /api/exams/:id          — single exam
 * POST /api/exams/generate           — AI-generate assessment blueprint
 * POST /api/exams/generate-dynamic   — LLM-generated original questions by % weights
 * POST /api/exams/blueprint-curator  — curate questions from question_bank by % weights
 * POST /api/exams/next-adaptive      — adaptive difficulty: fetch next question based on result
 * POST /api/exams/auto-save          — student auto-save exam progress
 * POST /api/exams/execute-code       — run code in sandbox
 * POST /api/exams/validate-code      — LeetCode-style validation against test cases
 * POST /api/exams/run-tests          — auto-grade code against test cases
 * GET  /api/exams/:id/attempt        — get active attempt for resume
 */
router.get("/", authenticate, examController.list);
router.get("/active", authenticate, examController.listActive);
router.get("/languages", authenticate, examController.getSupportedLanguages);
router.get("/:id", authenticate, examController.getById);

// Assessment generation (admin / hr / college)
router.post(
  "/generate",
  authenticate,
  authorize("admin", "super_admin", "hr", "college", "college_admin"),
  validate(generateAssessmentSchema),
  examController.generateAssessment,
);

// Dynamic LLM generation — GPT-4o generates brand-new original questions
router.post(
  "/generate-dynamic",
  authenticate,
  authorize("admin", "super_admin", "hr", "college", "college_admin"),
  validate(generateDynamicSchema),
  examController.generateDynamic,
);

// Blueprint curator — curate from question_bank by percentage weights
router.post(
  "/blueprint-curator",
  authenticate,
  authorize("admin", "super_admin", "hr", "college", "college_admin"),
  validate(blueprintCuratorSchema),
  examController.blueprintCurator,
);

// Adaptive complexity — get next question with adjusted difficulty
router.post(
  "/next-adaptive",
  authenticate,
  validate(nextAdaptiveSchema),
  examController.nextAdaptive,
);

// Code execution (any authenticated user — students taking exams)
router.post(
  "/execute-code",
  authenticate,
  validate(executeCodeSchema),
  examController.executeCode,
);

// LeetCode-style code validation (student exam submissions)
router.post(
  "/validate-code",
  authenticate,
  validate(validateCodeSchema),
  examController.validateCode,
);

// Auto-graded test case runner
router.post(
  "/run-tests",
  authenticate,
  validate(runTestsSchema),
  examController.runTestCases,
);

// Student auto-save exam progress
router.post(
  "/auto-save",
  authenticate,
  authorize("student"),
  validate(autoSaveSchema),
  examAttemptController.autoSave,
);

// Student: get active attempt for an exam (for resume on reconnect)
router.get(
  "/:id/attempt",
  authenticate,
  examAttemptController.getActiveAttempt,
);

const assignExamSchema = z.object({
  campus_ids: z.array(z.string().uuid()).min(1, "At least one campus is required"),
});

// Admin/HR: Assign assessment to campuses
router.post(
  "/:id/assign",
  authenticate,
  authorize("admin", "super_admin", "hr"),
  validate(assignExamSchema),
  examController.assignExam,
);

// Management: View live progress
router.get(
  "/:id/progress",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "cxo", "college", "college_admin", "college_staff"),
  examController.getProgress,
);

// Management: Terminate entire exam
router.post(
  "/:id/terminate",
  authenticate,
  authorize("admin", "super_admin", "hr"),
  examController.terminateExam,
);

// Management: Terminate specific student session
router.post(
  "/:id/sessions/:sessionId/terminate",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "college", "college_admin", "college_staff"),
  examController.terminateStudentSession,
);

// Management: Reset specific student session (for malpractices / re-takes)
router.post(
  "/:id/sessions/:sessionId/reset",
  authenticate,
  authorize("admin", "super_admin", "hr", "engineer", "college", "college_admin", "college_staff"),
  examController.resetStudentSession,
);

export default router;
