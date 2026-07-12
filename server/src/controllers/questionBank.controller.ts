import { Request, Response, NextFunction } from "express";
import * as qbService from "../services/questionBank.service.js";
import { parsePdfQuestions } from "../services/pdfQuestionImport.service.js";
import { ApiResponse, QuestionCategory, QuestionType, DifficultyLevel } from "../types/index.js";

/**
 * GET /api/question-bank
 * List / filter questions with pagination.
 */
export const list = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const {
      category, type, difficulty_level, tags, search, is_active,
      status, bloom_level, source, limit, offset,
    } = req.query as Record<string, string | undefined>;

    const result = await qbService.filterQuestions({
      category: category as QuestionCategory | undefined,
      type: type as QuestionType | undefined,
      difficulty_level: difficulty_level as DifficultyLevel | undefined,
      tags: tags ? (tags as string).split(",") : undefined,
      search: search as string | undefined,
      is_active: is_active !== undefined ? is_active === "true" : undefined,
      status: status as string | undefined,
      bloom_level: bloom_level as string | undefined,
      source: source as "ai-generated" | "manual" | undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.rows,
      meta: {
        page: Math.floor(result.offset / result.limit) + 1,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/question-bank/categories
 * Aggregated counts per category.
 */
export const categoryCounts = async (
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const counts = await qbService.getCategoryCounts();
    res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/question-bank/random
 * Get random questions by category/type/difficulty.
 */
export const random = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { category, type, difficulty_level, count } = req.query as Record<string, string>;
    const rows = await qbService.getRandomQuestions(
      category as QuestionCategory,
      type as QuestionType,
      difficulty_level as DifficultyLevel,
      parseInt(count ?? "10", 10),
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/question-bank/:id
 * Single question by ID.
 */
export const getById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const row = await qbService.getQuestionById(req.params.id as string);
    if (!row) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/question-bank
 * Create a new question.
 */
export const create = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const row = await qbService.createQuestion({
      ...req.body,
      created_by: (req as any).user?.userId ?? null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/question-bank/bulk
 * Bulk-insert questions (e.g. AI-generated batch).
 */
export const bulkCreate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { rows, errors } = await qbService.bulkInsert(
      req.body.questions.map((q: any) => ({
        ...q,
        created_by: (req as any).user?.userId ?? null,
      })),
    );
    res.status(201).json({
      success: true,
      data: rows,
      errors,
      message: `${rows.length} question(s) created${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/question-bank/import-pdf/parse
 * Parse an uploaded question PDF into structured MCQ candidates.
 * Read-only: returns parsed questions + warnings for the admin to review;
 * the confirmed subset is then inserted through POST /bulk.
 */
export const parsePdfImport = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const file = (req as Request & { file?: { buffer: Buffer; originalname: string } }).file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "No PDF uploaded — attach the file as multipart field \"file\"" });
    }

    const result = await parsePdfQuestions(file.buffer);
    res.json({
      success: true,
      data: {
        filename: file.originalname,
        ...result,
      },
      message: `Parsed ${result.questions.length} question(s) from ${result.meta.pages} page(s)`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/question-bank/:id
 * Update a question.
 */
export const update = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const row = await qbService.updateQuestion(req.params.id as string, req.body);
    if (!row) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/question-bank/:id
 * Soft-delete (deactivate) a question.
 */
export const deactivate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const row = await qbService.deactivateQuestion(req.params.id as string);
    if (!row) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
    res.json({ success: true, data: row, message: "Question deactivated" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/question-bank/:id/permanent
 * Soft-delete a question (deleted_at). Kept route name for API compatibility.
 */
export const hardDelete = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const result = await qbService.deleteQuestion(req.params.id as string);
    if (!result) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
    res.json({ success: true, message: "Question soft-deleted" });
  } catch (err) {
    next(err);
  }
};
