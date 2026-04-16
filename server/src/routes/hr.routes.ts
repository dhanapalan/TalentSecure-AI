import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query, queryOne } from "../config/database.js";

const router = Router();

/**
 * GET /api/hr/stats
 * Aggregate metrics for the HR Dashboard Overview
 */
router.get("/stats", authenticate, authorize("hr", "admin", "super_admin", "cxo"), async (req, res, next) => {
    try {
        const stats = await queryOne(`
            SELECT
                (SELECT COUNT(*)::int FROM colleges WHERE is_active = TRUE) as campus_count,
                (SELECT COUNT(*)::int FROM student_details) as student_count,
                (SELECT COUNT(*)::int FROM exams WHERE is_active = TRUE) as active_exams,
                (SELECT COUNT(*)::int FROM cheating_logs WHERE risk_score >= 70) as critical_violations,
                COALESCE(
                    (SELECT ROUND(
                        100.0 * COUNT(*) FILTER (WHERE ms.final_score >= e.cutoff_score) / NULLIF(COUNT(*), 0)
                    )::int
                    FROM marks_scored ms
                    JOIN exams e ON e.id = ms.exam_id),
                    0
                ) as pass_ratio,
                COALESCE(
                    (SELECT ROUND(AVG(ms.final_score))::int FROM marks_scored ms),
                    0
                ) as avg_score,
                (SELECT COUNT(*)::int FROM student_details
                 WHERE created_at >= NOW() - INTERVAL '30 days') as new_students_this_month
        `);

        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/hr/trend
 * Monthly student registration + exam session counts for the last 6 months
 */
router.get("/trend", authenticate, authorize("hr", "admin", "super_admin", "cxo"), async (req, res, next) => {
    try {
        const registrations = await query(`
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
                DATE_TRUNC('month', created_at) AS month_start,
                COUNT(*)::int AS students
            FROM student_details
            WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at)
        `);

        const sessions = await query(`
            SELECT
                TO_CHAR(DATE_TRUNC('month', started_at), 'Mon') AS month,
                DATE_TRUNC('month', started_at) AS month_start,
                COUNT(DISTINCT student_id)::int AS screened
            FROM exam_sessions
            WHERE started_at >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
            GROUP BY DATE_TRUNC('month', started_at)
            ORDER BY DATE_TRUNC('month', started_at)
        `);

        // Merge by month
        const sessionMap = new Map(sessions.map((s: any) => [s.month, s.screened]));
        const trend = registrations.map((r: any) => ({
            month: r.month,
            students: r.students,
            screened: sessionMap.get(r.month) ?? 0,
        }));

        res.json({ success: true, data: trend });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/hr/activity
 * Recent platform activity — derived from audit logs and recent records
 */
router.get("/activity", authenticate, authorize("hr", "admin", "super_admin", "cxo"), async (req, res, next) => {
    try {
        const rows = await query(`
            SELECT id::text, action as type, reason as text,
                   created_at,
                   CASE
                     WHEN action LIKE 'CAMPUS%' THEN 'campus'
                     WHEN action LIKE 'EXAM%' OR action LIKE 'ASSESSMENT%' THEN 'assessment'
                     WHEN action LIKE '%VIOLATION%' OR action LIKE '%CHEAT%' OR action LIKE '%SECURITY%' THEN 'security'
                     ELSE 'student'
                   END as category
            FROM rbac_audit_logs
            ORDER BY created_at DESC
            LIMIT 20
        `);

        const activities = rows.map((r: any) => ({
            id: r.id,
            text: r.text || r.type,
            time: r.created_at,
            type: r.category,
        }));

        res.json({ success: true, data: activities });
    } catch (err) {
        next(err);
    }
});

export default router;
