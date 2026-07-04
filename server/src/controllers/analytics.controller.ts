import { Request, Response } from "express";
import { query } from "../config/database.js";

export const getPlatformMetrics = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const [usersResult, collegesResult, workflowsResult, auditResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`
      ),
      query(
        `SELECT COUNT(*) as count FROM colleges WHERE deleted_at IS NULL`
      ),
      query(
        `SELECT COUNT(*) as count FROM workflows WHERE deleted_at IS NULL`
      ),
      query(
        `SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= $1`,
        [fromDate]
      ),
    ]);

    res.json({
      success: true,
      data: {
        total_users: parseInt(usersResult[0]?.count || 0),
        total_colleges: parseInt(collegesResult[0]?.count || 0),
        total_workflows: parseInt(workflowsResult[0]?.count || 0),
        audit_actions: parseInt(auditResult[0]?.count || 0),
        period_days: Number(days),
      },
    });
  } catch (error: any) {
    console.error("Error getting platform metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform metrics",
    });
  }
};

export const getCollegeMetrics = async (req: Request, res: Response) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const fromDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const result = await query(
      `SELECT
        c.id, c.name, c.is_approved,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.created_at >= $1 THEN u.id END) as new_users
       FROM colleges c
       LEFT JOIN users u ON c.id = u.college_id
       WHERE c.deleted_at IS NULL
       GROUP BY c.id, c.name, c.is_approved
       ORDER BY user_count DESC
       LIMIT $2`,
      [fromDate, Number(limit)]
    );

    res.json({
      success: true,
      data: result.map((row: any) => ({
        id: row.id,
        name: row.name,
        is_approved: row.is_approved,
        user_count: parseInt(row.user_count),
        new_users: parseInt(row.new_users),
      })),
    });
  } catch (error: any) {
    console.error("Error getting college metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get college metrics",
    });
  }
};

export const getUserMetrics = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        role,
        COUNT(*) as count,
        COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_count
       FROM users
       WHERE deleted_at IS NULL
       GROUP BY role
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: result.map((row: any) => ({
        role: row.role,
        total: parseInt(row.count),
        active: parseInt(row.active_count),
      })),
    });
  } catch (error: any) {
    console.error("Error getting user metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user metrics",
    });
  }
};

export const getActivityMetrics = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const fromDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as action_count,
        COUNT(DISTINCT CASE WHEN action LIKE '%CREATE%' THEN 1 END) as creates,
        COUNT(DISTINCT CASE WHEN action LIKE '%UPDATE%' THEN 1 END) as updates,
        COUNT(DISTINCT CASE WHEN action LIKE '%DELETE%' THEN 1 END) as deletes
       FROM audit_logs
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [fromDate]
    );

    res.json({
      success: true,
      data: result.map((row: any) => ({
        date: row.date,
        total: parseInt(row.action_count),
        creates: parseInt(row.creates),
        updates: parseInt(row.updates),
        deletes: parseInt(row.deletes),
      })),
    });
  } catch (error: any) {
    console.error("Error getting activity metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get activity metrics",
    });
  }
};

export const getWorkflowMetrics = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        is_active,
        COUNT(*) as count,
        COUNT(DISTINCT CASE WHEN trigger_event LIKE '%assessment%' THEN id END) as assessment_workflows
       FROM workflows
       WHERE deleted_at IS NULL
       GROUP BY is_active`
    );

    const activeCount = result.find((r: any) => r.is_active)?.count || 0;
    const inactiveCount = result.find((r: any) => !r.is_active)?.count || 0;

    res.json({
      success: true,
      data: {
        active: parseInt(activeCount),
        inactive: parseInt(inactiveCount),
        total: parseInt(activeCount) + parseInt(inactiveCount),
      },
    });
  } catch (error: any) {
    console.error("Error getting workflow metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workflow metrics",
    });
  }
};
