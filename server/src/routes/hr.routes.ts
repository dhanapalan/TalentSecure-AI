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
                (SELECT COUNT(*) FROM campuses) as campus_count,
                (SELECT COUNT(*) FROM student_profiles) as student_count,
                (SELECT COUNT(*) FROM assessments WHERE status = 'SCHEDULED' OR status = 'IN_PROGRESS') as active_exams,
                (SELECT COUNT(*) FROM proctoring_violations WHERE severity = 'HIGH' OR severity = 'CRITICAL') as critical_violations
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
