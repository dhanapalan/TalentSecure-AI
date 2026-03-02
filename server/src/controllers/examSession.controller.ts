// =============================================================================
// TalentSecure AI — Exam Session Controller
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as examSessionService from "../services/examSession.service.js";

// GET /api/exam-sessions/my-drives
export async function getMyDrives(req: Request, res: Response, next: NextFunction) {
    try {
        const studentId = req.user!.userId;
        const drives = await examSessionService.getStudentDrives(studentId);
        res.json({ success: true, data: drives });
    } catch (err) {
        next(err);
    }
}

// POST /api/exam-sessions/:driveId/start
export async function startSession(req: Request, res: Response, next: NextFunction) {
    try {
        const studentId = req.user!.userId;
        const { driveId } = req.params as { driveId: string };
        const session = await examSessionService.startSession(driveId, studentId);
        res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
}

// GET /api/exam-sessions/:driveId/session
export async function getSession(req: Request, res: Response, next: NextFunction) {
    try {
        const studentId = req.user!.userId;
        const { driveId } = req.params as { driveId: string };
        const result = await examSessionService.getSession(driveId, studentId);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

// PUT /api/exam-sessions/:driveId/save
export async function saveAnswer(req: Request, res: Response, next: NextFunction) {
    try {
        const studentId = req.user!.userId;
        const { driveId } = req.params as { driveId: string };
        const result = await examSessionService.saveAnswer(driveId, studentId, req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

// POST /api/exam-sessions/:driveId/submit
export async function submitExam(req: Request, res: Response, next: NextFunction) {
    try {
        const studentId = req.user!.userId;
        const { driveId } = req.params as { driveId: string };
        const result = await examSessionService.submitExam(driveId, studentId);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}
