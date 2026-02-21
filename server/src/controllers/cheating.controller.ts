import { Request, Response, NextFunction } from "express";
import * as cheatingService from "../services/cheating.service.js";
import { ApiResponse } from "../types/index.js";

/**
 * POST /api/cheating-logs
 * Body: { student_id, exam_id, violation_type, risk_score, screenshot_url? }
 * Auth: x-api-key header (AI engine service key)
 */
export const createLog = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { student_id, exam_id, violation_type, risk_score, screenshot_url } =
      req.body;

    const log = await cheatingService.createCheatingLog({
      student_id,
      exam_id,
      violation_type,
      risk_score,
      screenshot_url,
    });

    res.status(201).json({
      success: true,
      data: log,
      message: "Cheating log recorded",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cheating-logs
 * Query: ?limit=50&offset=0
 * Auth: JWT (admin / college)
 */
export const listLogs = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const [logs, total] = await Promise.all([
      cheatingService.listCheatingLogs(limit, offset),
      cheatingService.countCheatingLogs(),
    ]);
    res.json({
      success: true,
      data: logs,
      meta: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cheating-logs/stats
 * Dashboard summary stats.
 * Auth: JWT (admin / college)
 */
export const stats = async (
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const data = await cheatingService.getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cheating-logs/report
 * Body: { exam_id, violation_type }
 * Auth: JWT (student — self-reports browser violations)
 */
export const reportViolation = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const studentId = req.user!.userId;
    const { exam_id, violation_type } = req.body;
    const log = await cheatingService.createStudentViolation(
      studentId,
      exam_id,
      violation_type,
    );
    res.status(201).json({
      success: true,
      data: log,
      message: "Violation recorded",
    });
  } catch (err) {
    next(err);
  }
};
