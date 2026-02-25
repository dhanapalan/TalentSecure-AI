import { Request, Response, NextFunction } from "express";
import * as examService from "../services/exam.service.js";
import * as llmService from "../services/llm.service.js";
import * as codeExecService from "../services/codeExecution.service.js";
import * as codeValidationService from "../services/codeValidation.service.js";
import * as qbService from "../services/questionBank.service.js";
import * as adaptiveService from "../services/adaptive.service.js";
import { ApiResponse } from "../types/index.js";

/**
 * GET /api/exams
 */
export const list = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const collegeId = req.user?.college_id || undefined;
    const isCentral = ["super_admin", "admin", "hr"].includes(req.user?.role || "");

    const exams = await examService.listExams(isCentral ? undefined : collegeId);
    res.json({ success: true, data: exams });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/exams/active
 */
export const listActive = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const collegeId = req.user?.college_id || undefined;
    const isCentral = ["super_admin", "admin", "hr"].includes(req.user?.role || "");

    const exams = await examService.listActiveExams(isCentral ? undefined : collegeId);
    res.json({ success: true, data: exams });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/exams/:id
 */
export const getById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const exam = await examService.getExamById(req.params.id as string);
    if (!exam) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

// ── Assessment Blueprint Generation (LLM) ───────────────────────────────────

/**
 * POST /api/exams/generate
 * Body: { categories: [{ category, percentage }], 
 *         totalQuestions?: number, total_questions?: number,
 *         duration_minutes?: number }
 *
 * Generates an assessment via OpenAI, then persists it to the exams table.
 */
export const generateAssessment = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const {
      categories,
      totalQuestions,
      total_questions,
      duration_minutes = 60,
    } = req.body;

    const numQuestions = total_questions ?? totalQuestions ?? 20;

    const assessment = await llmService.generateAssessment(
      categories,
      numQuestions,
      duration_minutes,
    );

    // Persist the generated exam
    const createdBy = req.user?.userId ?? null;
    const exam = await examService.createExam({
      title: assessment.title ?? "AI-Generated Assessment",
      total_questions: assessment.totalQuestions,
      duration_minutes,
      created_by: createdBy,
    });

    res.json({
      success: true,
      data: { exam, assessment },
      message: `Generated ${assessment.totalQuestions} questions, exam saved (${duration_minutes} min)`,
    });
  } catch (err) {
    next(err);
  }
};

// ── Code Execution (Judge0) ──────────────────────────────────────────────────

/**
 * POST /api/exams/execute-code
 * Body: { sourceCode, language, stdin? }
 * Run a single code submission and return stdout/stderr.
 */
export const executeCode = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { sourceCode, language, stdin } = req.body;
    const result = await codeExecService.executeCode({
      sourceCode,
      language,
      stdin,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/run-tests
 * Body: { sourceCode, language, testCases: [{ input, expectedOutput }],
 *         timeLimitMs?, memoryLimitKb? }
 * Auto-grade code against hidden test cases.
 */
export const runTestCases = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { sourceCode, language, testCases, timeLimitMs, memoryLimitKb } = req.body;
    const report = await codeExecService.runTestCases(
      sourceCode,
      language,
      testCases,
      timeLimitMs,
      memoryLimitKb,
    );
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/validate-code
 * Body: { sourceCode, language, questionId, testCases: [{ input, expectedOutput }],
 *         timeLimitMs?, memoryLimitKb? }
 * LeetCode-style validation: runs student code against hidden test cases
 * and returns a pass/fail verdict per test case with an overall score.
 */
export const validateCode = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { sourceCode, language, questionId, testCases, timeLimitMs, memoryLimitKb } = req.body;
    const report = await codeValidationService.validateCode({
      sourceCode,
      language,
      questionId,
      testCases,
      timeLimitMs,
      memoryLimitKb,
    });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/exams/languages
 * Return list of supported programming languages.
 */
export const getSupportedLanguages = async (
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
) => {
  const languages = codeExecService.getSupportedLanguages();
  res.json({ success: true, data: languages });
};

// ── Dynamic Assessment Generator (LLM) ──────────────────────────────────────

/**
 * POST /api/exams/generate-dynamic
 * Body: { weights: { [category]: percentage }, total_questions: number }
 * Uses OpenAI gpt-4o to generate brand-new, original questions matching
 * the exact percentage weights. Returns strict JSON with question_text,
 * options / correct_answer (MCQ) or hidden_test_cases (coding).
 */
export const generateDynamic = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { weights, total_questions, questions_per_student, duration_minutes = 60 } = req.body;

    // Convert { "Aptitude": 30, "Python Coding": 70 } → DynamicWeight[]
    const dynamicWeights: llmService.DynamicWeight[] = Object.entries(
      weights as Record<string, number>,
    ).map(([category, percentage]) => ({ category, percentage }));

    const assessment = await llmService.generateDynamicAssessment(
      dynamicWeights,
      total_questions,
      duration_minutes,
    );

    // Persist the generated exam
    const createdBy = req.user?.userId ?? null;
    const exam = await examService.createExam({
      title: `AI Assessment — ${assessment.total_questions}Q / ${duration_minutes}min`,
      total_questions: assessment.total_questions,
      questions_per_student: questions_per_student || null,
      duration_minutes,
      created_by: createdBy,
    });

    res.json({
      success: true,
      data: { exam, assessment },
      message: `Generated ${assessment.total_questions} original questions via GPT-4o, exam saved (${duration_minutes} min)`,
    });
  } catch (err) {
    next(err);
  }
};

// ── Blueprint Curator (Question Bank) ────────────────────────────────────────

/**
 * POST /api/exams/blueprint-curator
 * Body: { weights: { [category]: percentage }, total_questions: number }
 * Queries question_bank and returns a curated random selection matching
 * the requested percentage distribution.
 */
export const blueprintCurator = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { weights, total_questions, questions_per_student, duration_minutes = 60 } = req.body;

    // Convert { "Reasoning": 20, "Programming": 60, ... } → BlueprintWeight[]
    const weightEntries: qbService.BlueprintWeight[] = Object.entries(
      weights as Record<string, number>,
    ).map(([category, percentage]) => ({ category, percentage }));

    const blueprint = await qbService.curateBlueprint(
      weightEntries,
      total_questions,
    );

    // Persist the curated exam
    const createdBy = req.user?.userId ?? null;
    const exam = await examService.createExam({
      title: `Curated Assessment — ${blueprint.totalCurated}Q / ${duration_minutes}min`,
      total_questions: blueprint.totalCurated,
      questions_per_student: questions_per_student || null,
      duration_minutes,
      created_by: createdBy,
    });

    // Persist curated questions linked to this exam
    const questionIds = blueprint.questions
      .map((q: any) => q.id)
      .filter(Boolean);
    if (questionIds.length > 0) {
      await examService.persistExamQuestions(exam!.id, questionIds);
    }

    res.json({
      success: true,
      data: { exam, blueprint },
      message: `Curated ${blueprint.totalCurated}/${blueprint.totalRequested} questions, exam saved (${duration_minutes} min)`,
    });
  } catch (err) {
    next(err);
  }
};

// ── Adaptive Complexity (Next Question) ──────────────────────────────────

/**
 * POST /api/exams/next-adaptive
 * Body: {
 *   category: string,
 *   current_difficulty: "easy" | "medium" | "hard",
 *   answered_correctly: boolean,
 *   seen_question_ids?: string[]
 * }
 *
 * Returns the next question from the question_bank with adaptive difficulty:
 *   • correct answer   → difficulty steps UP
 *   • incorrect answer → difficulty steps DOWN
 *   • already at ceiling/floor → stays the same
 */
export const nextAdaptive = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const result = await adaptiveService.getNextAdaptiveQuestion(req.body);

    if (!result.question) {
      return res.status(404).json({
        success: false,
        error: "No more questions available in this category",
        data: {
          target_difficulty: result.target_difficulty,
          previous_difficulty: result.previous_difficulty,
          direction: result.direction,
          pool_remaining: result.pool_remaining,
        },
      });
    }

    res.json({
      success: true,
      data: result,
      message: `Difficulty ${result.direction}: ${result.previous_difficulty} → ${result.target_difficulty}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/:id/assign
 */
export const assignExam = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { campus_ids } = req.body;
    await examService.assignExamToColleges(id as string, campus_ids);
    res.json({ success: true, message: "Exam assigned to colleges successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/exams/:id/questions
 */
export const getExamQuestions = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id: examId } = req.params;
    const userId = req.user?.userId;
    const isStudent = req.user?.role === "student";

    let subsetIds: string[] | null = null;
    let attemptId: string | null = null;

    if (isStudent && userId) {
      const { getActiveAttempt } = await import("../services/examAttempt.service.js");
      const attempt = await getActiveAttempt(userId, examId as string);
      if (attempt?.question_ids) {
        subsetIds = attempt.question_ids;
        attemptId = attempt.id;
      }
    }

    const questions = await examService.getExamQuestions(examId as string, subsetIds);
    const exam = await examService.getExamById(examId as string);
    const colleges = await examService.getExamColleges(examId as string);

    res.json({
      success: true,
      data: {
        exam,
        questions,
        assignedColleges: colleges,
        attemptId // Include attempt ID for frontend context if it exists
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/exams/:id/progress
 */
export const getProgress = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    let campusId = req.query.campusId as string;

    // Security: If user is college staff/admin, they can ONLY see their own campus students
    const userRole = req.user?.role?.toLowerCase();
    if (userRole && (userRole.includes("college") || userRole.includes("campus"))) {
      campusId = (req.user?.college_id as string) || campusId;
    }

    const progress = await examService.getExamProgress(id as string, campusId);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/:id/terminate
 */
export const terminateExam = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await examService.terminateExam(id as string);
    res.json({ success: true, message: "Exam terminated globally" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/:id/sessions/:sessionId/terminate
 */
export const terminateStudentSession = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { sessionId } = req.params;
    const collegeId = req.user?.college_id || undefined;
    const isCentral = ["super_admin", "admin", "hr"].includes(req.user?.role || "");

    const result = await examService.terminateStudentSession(
      sessionId as string,
      isCentral ? undefined : collegeId
    );

    if (!result) {
      return res.status(403).json({ success: false, error: "Access denied or session not found" });
    }

    res.json({ success: true, message: "Student session terminated" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/exams/:id/sessions/:sessionId/reset
 */
export const resetStudentSession = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { sessionId } = req.params;
    const collegeId = req.user?.college_id || undefined;
    const isCentral = ["super_admin", "admin", "hr"].includes(req.user?.role || "");

    const success = await examService.resetStudentSession(
      sessionId as string,
      isCentral ? undefined : collegeId
    );

    if (!success) {
      return res.status(403).json({ success: false, error: "Access denied or session not found" });
    }

    res.json({ success: true, message: "Student session reset" });
  } catch (err) {
    next(err);
  }
};
