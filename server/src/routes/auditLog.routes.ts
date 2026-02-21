// =============================================================================
// TalentSecure AI — Audit Log Routes
// =============================================================================
// Admin-only routes to query the RBAC audit trail.
// Mounted at /api/audit-logs
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { queryAuditLogs } from "../services/audit.service.js";
import { AdminAuditAction } from "../types/index.js";

const router = Router();

/**
 * GET /api/audit-logs
 * Query audit logs with optional filters.
 * Only super_admin can access.
 *
 * Query params:
 *   actor_id, action, target_type, target_id, from, to, limit, offset
 */
router.get(
  "/",
  authenticate,
  authorize("super_admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { actor_id, action, target_type, target_id, from, to, limit, offset } = req.query;

      const logs = await queryAuditLogs({
        actor_id: actor_id as string | undefined,
        action: action as AdminAuditAction | undefined,
        target_type: target_type as string | undefined,
        target_id: target_id as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
