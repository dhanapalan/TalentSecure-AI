import { NextFunction, Request, Response } from "express";
import { query, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { proctoringService } from "../services/proctoring.service.js";

interface SessionScopeRow {
  id: string;
  student_id: string;
  college_id: string | null;
}

function isCollegeScopedRole(role?: string): boolean {
  const normalized = (role || "").toLowerCase();
  return normalized === "college_admin" || normalized === "college";
}

async function getSessionScope(sessionId: string): Promise<SessionScopeRow | null> {
  return queryOne<SessionScopeRow>(
    `SELECT ds.id, ds.student_id, u.college_id
     FROM drive_students ds
     JOIN users u ON u.id = ds.student_id
     WHERE ds.id = $1`,
    [sessionId],
  );
}

async function assertCollegeScope(req: Request, sessionId: string): Promise<void> {
  const session = await getSessionScope(sessionId);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (isCollegeScopedRole(req.user?.role)) {
    if (!req.user?.college_id) {
      throw new AppError("User is not associated with a college", 400);
    }
    if (session.college_id !== req.user.college_id) {
      throw new AppError("Not authorized to access this session", 403);
    }
  }
}

export const proctoringController = {
  /**
   * POST /api/proctoring/events
   * Log a proctoring event from the client
   */
  async logEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, eventType, metadata } = req.body as {
        sessionId?: string;
        eventType?: string;
        metadata?: unknown;
      };

      if (!sessionId || !eventType) {
        throw new AppError("Missing required fields: sessionId, eventType", 400);
      }

      const session = await getSessionScope(sessionId);
      if (!session) {
        throw new AppError("Session not found", 404);
      }
      if (session.student_id !== req.user?.userId) {
        throw new AppError("Cannot log events for another student's session", 403);
      }

      await proctoringService.logEvent(sessionId, eventType, metadata);
      res.json({ success: true, message: "Event logged" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/proctoring/live
   * Get live monitoring data for the admin dashboard
   */
  async getLiveMonitoring(req: Request, res: Response, next: NextFunction) {
    try {
      const driveId =
        typeof req.query.driveId === "string" && req.query.driveId.length > 0
          ? req.query.driveId
          : undefined;

      const data = await proctoringService.getLiveMonitoring(driveId);

      if (!isCollegeScopedRole(req.user?.role)) {
        res.json({ success: true, data });
        return;
      }

      if (!req.user?.college_id) {
        throw new AppError("User is not associated with a college", 400);
      }

      const allowedRows = await query<{ id: string }>(
        `SELECT ds.id
         FROM drive_students ds
         JOIN users u ON u.id = ds.student_id
         WHERE u.college_id = $1`,
        [req.user.college_id],
      );
      const allowed = new Set(allowedRows.map((r) => r.id));

      res.json({ success: true, data: data.filter((row: { id: string }) => allowed.has(row.id)) });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/proctoring/session/:sessionId/timeline
   * Get the chronological event timeline for a specific session
   */
  async getSessionTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      await assertCollegeScope(req, sessionId);
      const data = await proctoringService.getSessionTimeline(sessionId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/proctoring/session/:sessionId/clear
   * Admin action to manually clear an incident
   */
  async clearIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const { notes } = req.body as { notes?: string };

      await assertCollegeScope(req, sessionId);
      await proctoringService.clearIncident(sessionId, notes || "Cleared by Admin");

      res.json({ success: true, message: "Incident cleared" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/proctoring/session/:sessionId/terminate
   * Admin action to manually terminate a session
   */
  async terminateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params as { sessionId: string };
      const { reason } = req.body as { reason?: string };

      await assertCollegeScope(req, sessionId);
      await proctoringService.terminateSession(sessionId, reason || "Terminated by Admin manually");

      res.json({ success: true, message: "Session terminated" });
    } catch (error) {
      next(error);
    }
  },
};
