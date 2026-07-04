import { Request, Response } from "express";
import { query } from "../config/database.js";

/**
 * List audit logs with filtering
 */
export const listAuditTrail = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      action = "all",
      user_id = "all",
      resource_type = "all",
      from_date = null,
      to_date = null,
      severity = "all",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    // Action filter
    if (action && action !== "all") {
      whereClause += ` AND a.action = $${params.length + 1}`;
      params.push(action);
    }

    // User filter
    if (user_id && user_id !== "all") {
      whereClause += ` AND a.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    // Resource type filter
    if (resource_type && resource_type !== "all") {
      whereClause += ` AND a.resource_type = $${params.length + 1}`;
      params.push(resource_type);
    }

    // Date range filter
    if (from_date) {
      whereClause += ` AND a.created_at >= $${params.length + 1}`;
      params.push(from_date);
    }
    if (to_date) {
      whereClause += ` AND a.created_at <= $${params.length + 1}`;
      params.push(to_date);
    }

    // Severity filter (based on action type)
    if (severity && severity !== "all") {
      const severityMap: any = {
        HIGH: [
          "DELETE_USER",
          "DELETE_COLLEGE",
          "UPDATE_ROLE",
          "SUSPEND_USER",
          "DATABASE_BACKUP",
        ],
        MEDIUM: [
          "CREATE_USER",
          "UPDATE_USER",
          "UPDATE_COLLEGE",
          "APPROVE_COLLEGE",
          "REJECT_COLLEGE",
        ],
        LOW: [
          "LOGIN",
          "LOGOUT",
          "VIEW",
          "EXPORT",
        ],
      };

      if (severityMap[severity as string]) {
        const actions = severityMap[severity as string]
          .map((_: string, idx: number) => `$${params.length + 1 + idx}`)
          .join(",");
        whereClause += ` AND a.action IN (${actions})`;
        params.push(...severityMap[severity as string]);
      }
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM audit_logs a ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || 0);

    // Get paginated audit logs
    const result = await query(
      `SELECT
        a.id, a.action, a.resource_type, a.resource_id,
        a.changes, a.ip_address, a.created_at,
        u.full_name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Determine severity for each log
    const logs = result.map((log: any) => {
      let severity = "LOW";
      if (
        [
          "DELETE_USER",
          "DELETE_COLLEGE",
          "UPDATE_ROLE",
          "SUSPEND_USER",
          "DATABASE_BACKUP",
        ].includes(log.action)
      ) {
        severity = "HIGH";
      } else if (
        [
          "CREATE_USER",
          "UPDATE_USER",
          "UPDATE_COLLEGE",
          "APPROVE_COLLEGE",
          "REJECT_COLLEGE",
        ].includes(log.action)
      ) {
        severity = "MEDIUM";
      }

      return { ...log, severity };
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error listing audit trail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list audit trail",
      error: error.message,
    });
  }
};

/**
 * Get single audit entry details
 */
export const getAuditEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        a.id, a.action, a.resource_type, a.resource_id,
        a.changes, a.ip_address, a.created_at,
        u.id as user_id, u.full_name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Audit entry not found",
      });
    }

    const log = result[0];

    // Parse changes if JSON
    if (log.changes && typeof log.changes === "string") {
      try {
        log.changes = JSON.parse(log.changes);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.json({ success: true, data: log });
  } catch (error: any) {
    console.error("Error getting audit entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit entry",
      error: error.message,
    });
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    // Total actions in period
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'`
    );

    // Actions by type
    const byActionResult = await query(
      `SELECT action, COUNT(*) as count FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`
    );

    // Actions by user
    const byUserResult = await query(
      `SELECT u.full_name, u.email, COUNT(*) as count FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY count DESC
       LIMIT 10`
    );

    // Actions by resource type
    const byResourceResult = await query(
      `SELECT resource_type, COUNT(*) as count FROM audit_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY resource_type
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: {
        total_actions: parseInt(totalResult[0]?.count || 0),
        period_days: Number(days),
        by_action: byActionResult,
        by_user: byUserResult,
        by_resource_type: byResourceResult,
      },
    });
  } catch (error: any) {
    console.error("Error getting audit stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit statistics",
      error: error.message,
    });
  }
};

/**
 * Export audit logs
 */
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      format = "csv",
      from_date = null,
      to_date = null,
      action = "all",
    } = req.body;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (action && action !== "all") {
      whereClause += ` AND a.action = $${params.length + 1}`;
      params.push(action);
    }
    if (from_date) {
      whereClause += ` AND a.created_at >= $${params.length + 1}`;
      params.push(from_date);
    }
    if (to_date) {
      whereClause += ` AND a.created_at <= $${params.length + 1}`;
      params.push(to_date);
    }

    const result = await query(
      `SELECT
        a.id, a.action, a.resource_type, a.resource_id,
        a.changes, a.ip_address, a.created_at,
        u.full_name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "ID",
        "Timestamp",
        "User",
        "Email",
        "Action",
        "Resource Type",
        "Resource ID",
        "IP Address",
        "Changes",
      ];

      const rows = result.map((log: any) => [
        log.id,
        log.created_at,
        log.user_name,
        log.user_email,
        log.action,
        log.resource_type,
        log.resource_id,
        log.ip_address,
        typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell || ""}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`
      );
      res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${new Date().toISOString()}.json"`
      );
      res.json(result);
    }
  } catch (error: any) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
};
