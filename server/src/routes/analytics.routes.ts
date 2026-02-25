import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { queryOne } from "../config/database.js";
import { ApiResponse } from "../types/index.js";

interface DashboardMetricsRow {
  total_students: number;
  completed_attempts: number;
  total_attempts: number;
  avg_risk_score: number | null;
}

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Aggregate metrics for Analytics + Proctoring pages.
 */
router.get(
  "/dashboard",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo", "engineer", "college", "college_admin"),
  async (_req, res: import("express").Response<ApiResponse>, next) => {
    try {
      const metrics = await queryOne<DashboardMetricsRow>(
        `SELECT
            (SELECT COUNT(*)::int FROM student_details) AS total_students,
            (SELECT COUNT(*)::int FROM exam_attempts WHERE status = 'completed') AS completed_attempts,
            (SELECT COUNT(*)::int FROM exam_attempts) AS total_attempts,
            (SELECT AVG(risk_score)::float FROM cheating_logs) AS avg_risk_score`,
      );

      const segmentRows = await queryOne<{ segment_distribution: Record<string, number> }>(
        `SELECT COALESCE(jsonb_object_agg(bucket, count), '{}'::jsonb) AS segment_distribution
         FROM (
           SELECT
             COALESCE(NULLIF(TRIM(degree), ''), 'Unspecified') AS bucket,
             COUNT(*)::int AS count
           FROM student_details
           GROUP BY COALESCE(NULLIF(TRIM(degree), ''), 'Unspecified')
         ) d`,
      );

      const totalStudents = metrics?.total_students ?? 0;
      const totalAttempts = metrics?.total_attempts ?? 0;
      const completedAttempts = metrics?.completed_attempts ?? 0;
      const completionRate =
        totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;
      const avgRisk = Number(metrics?.avg_risk_score ?? 0);
      const avgProctoringIntegrity = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));

      res.json({
        success: true,
        data: {
          totalStudents,
          assessmentCompletionRate: completionRate,
          avgProctoringIntegrity,
          segmentDistribution: segmentRows?.segment_distribution ?? {},
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
