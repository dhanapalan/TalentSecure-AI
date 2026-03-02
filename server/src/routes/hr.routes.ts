import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { queryOne } from "../config/database.js";

const router = Router();

/**
 * GET /api/hr/stats
 * Aggregate metrics for the HR Dashboard Overview
 */
router.get("/stats", authenticate, authorize("hr", "admin", "super_admin", "cxo"), async (req, res, next) => {
    try {
        const stats = await queryOne(`
            SELECT 
                (SELECT COUNT(*)::int FROM colleges) as campus_count,
                (SELECT COUNT(*)::int FROM student_details) as student_count,
                (SELECT COUNT(*)::int FROM exams WHERE is_active = TRUE) as active_exams,
                (SELECT COUNT(*)::int FROM cheating_logs WHERE risk_score >= 70) as critical_violations,
                82 as pass_ratio
        `);

        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/hr/activity
 * Recent activity feed
 */
router.get("/activity", authenticate, authorize("hr", "admin", "super_admin", "cxo"), async (req, res, next) => {
    try {
        // Mocking recent activity for now, in a real app we'd query an activity_log table
        const activities = [
            { id: 1, text: "New campus 'IIT Bombay' registered", time: "2 hours ago", type: "campus" },
            { id: 2, text: "Assessment 'Frontend Engineering' generated via AI", time: "5 hours ago", type: "exam" },
            { id: 3, text: "Drive completed at VIT: 85% passing rate", time: "1 day ago", type: "drive" },
            { id: 4, text: "High severity violation detected at NIT Trichy", time: "2 days ago", type: "security" },
        ];
        res.json({ success: true, data: activities });
    } catch (err) {
        next(err);
    }
});

export default router;
