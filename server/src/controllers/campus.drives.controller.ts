import { Request, Response, NextFunction } from "express";
import { query, queryOne, pool } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { ApiResponse } from "../types/index.js";

/**
 * Resolve the college ID for the current user.
 */
async function resolveCollegeId(req: Request): Promise<string> {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    if (user.college_id) return user.college_id;

    const row = await queryOne<{ id: string }>(
        `SELECT id FROM colleges WHERE legacy_user_id = $1`,
        [user.userId]
    );
    if (row?.id) return row.id;

    throw new AppError("Unauthorized: College context missing", 403);
}

/**
 * GET /api/campus/drives
 * List drives assigned to the current college with KPI summary.
 */
export async function listCampusDrives(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);

        // 1. Get KPIs
        const kpiQuery = `
            SELECT 
                COUNT(*) as total_drives,
                SUM(CASE WHEN d.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_drives,
                SUM(CASE WHEN d.status = 'SCHEDULED' THEN 1 ELSE 0 END) as upcoming_drives,
                SUM(CASE WHEN d.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_drives
            FROM assessment_drives d
            JOIN drive_assignments da ON da.drive_id = d.id
            WHERE da.college_id = $1
        `;
        const kpis = await queryOne(kpiQuery, [collegeId]);

        // 2. Get Drives List
        const drivesQuery = `
            SELECT 
                d.id,
                d.name,
                d.status,
                d.scheduled_start,
                d.scheduled_end,
                d.total_students as registered_students,
                (SELECT COUNT(*) FROM marks_scored ms 
                 JOIN student_details sd ON ms.student_id = sd.user_id
                 WHERE sd.college_id = $1 AND ms.exam_id IN (
                     SELECT id FROM exams WHERE created_at >= d.scheduled_start -- simplified logic for now
                 )) as appeared_students
            FROM assessment_drives d
            JOIN drive_assignments da ON da.drive_id = d.id
            WHERE da.college_id = $1
            ORDER BY d.scheduled_start DESC
        `;
        const drives = await query(drivesQuery, [collegeId]);

        res.json({
            success: true,
            data: {
                kpis: {
                    total: parseInt(kpis?.total_drives || 0),
                    active: parseInt(kpis?.active_drives || 0),
                    upcoming: parseInt(kpis?.upcoming_drives || 0),
                    completed: parseInt(kpis?.completed_drives || 0)
                },
                drives: drives.map(d => ({
                    ...d,
                    appeared_students: parseInt(d.appeared_students || 0)
                }))
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/campus/drives/:id
 * Get specific drive summary for the college.
 */
export async function getDriveSummary(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;

        const drive = await queryOne(`
            SELECT d.*, art.name as rule_name
            FROM assessment_drives d
            JOIN drive_assignments da ON da.drive_id = d.id
            LEFT JOIN assessment_rule_templates art ON art.id = d.rule_id
            WHERE d.id = $1 AND da.college_id = $2
        `, [driveId, collegeId]);

        if (!drive) {
            throw new AppError("Drive not found or not assigned to your campus", 404);
        }

        res.json({
            success: true,
            data: drive
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/campus/drives/:id/students
 * List students assigned to this drive in this college.
 */
export async function getDriveStudents(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;

        // Note: This assumes drive_students table exists or we filter student_details
        // Based on implementation patterns, we likely need to check drive_students
        const students = await query(`
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                sd.student_identifier as roll_number,
                sd.specialization as department,
                ds.status as drive_status,
                ms.final_score as score
            FROM drive_students ds
            JOIN users u ON ds.student_id = u.id
            JOIN student_details sd ON u.id = sd.user_id
            LEFT JOIN marks_scored ms ON ms.student_id = u.id AND ms.exam_id IN (
                -- This subquery might be complex, simplified for now
                SELECT id FROM exams WHERE id = ds.current_exam_id
            )
            WHERE ds.drive_id = $1 AND sd.college_id = $2
        `, [driveId, collegeId]);

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/campus/drives/:id/attendance
 * Attendance summary for the drive.
 */
export async function getDriveAttendance(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;

        const stats = await queryOne(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ds.status IN ('COMPLETED', 'STARTED') THEN 1 ELSE 0 END) as appeared,
                SUM(CASE WHEN ds.status = 'NOT_STARTED' THEN 1 ELSE 0 END) as absent
            FROM drive_students ds
            JOIN student_details sd ON ds.student_id = sd.user_id
            WHERE ds.drive_id = $1 AND sd.college_id = $2
        `, [driveId, collegeId]);

        res.json({
            success: true,
            data: {
                total: parseInt(stats?.total || 0),
                appeared: parseInt(stats?.appeared || 0),
                absent: parseInt(stats?.absent || 0),
                attendance_percentage: stats?.total ? ((stats.appeared / stats.total) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/campus/drives/:id/results
 * Results and ranking summary.
 */
export async function getDriveResults(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;

        const results = await query(`
            SELECT 
                u.name,
                u.email,
                sd.student_identifier as roll_number,
                ms.final_score as score,
                RANK() OVER (ORDER BY ms.final_score DESC) as rank
            FROM marks_scored ms
            JOIN users u ON ms.student_id = u.id
            JOIN student_details sd ON u.id = sd.user_id
            JOIN drive_students ds ON ds.student_id = u.id AND ds.drive_id = $1
            WHERE sd.college_id = $2
            ORDER BY ms.final_score DESC
        `, [driveId, collegeId]);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/campus/drives/:id/integrity
 * Integrity summary.
 */
export async function getDriveIntegrity(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;

        const integrity = await query(`
            SELECT 
                u.name,
                sd.student_identifier as roll_number,
                COALESCE(sd.avg_integrity_score, 100) as integrity_score,
                (SELECT COUNT(*) FROM cheating_logs cl WHERE cl.student_id = u.id) as violations
            FROM users u
            JOIN student_details sd ON u.id = sd.user_id
            JOIN drive_students ds ON ds.student_id = u.id AND ds.drive_id = $1
            WHERE sd.college_id = $2
        `, [driveId, collegeId]);

        res.json({
            success: true,
            data: integrity
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/campus/drives/:id/placement
 * Update placement status for students.
 */
export async function updatePlacementStatus(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
        const collegeId = await resolveCollegeId(req);
        const driveId = req.params.id;
        const { studentId, status } = req.body;

        if (!['Offered', 'Joined', 'Rejected', 'Interviewing'].includes(status)) {
            throw new AppError("Invalid placement status", 400);
        }

        // Verify student belongs to this college and drive
        const verification = await queryOne(`
            SELECT 1 FROM drive_students ds
            JOIN student_details sd ON ds.student_id = sd.user_id
            WHERE ds.drive_id = $1 AND ds.student_id = $2 AND sd.college_id = $3
        `, [driveId, studentId, collegeId]);

        if (!verification) {
            throw new AppError("Student not found in this drive for your campus", 404);
        }

        await query(
            `UPDATE student_details SET placement_status = $1 WHERE user_id = $2`,
            [status, studentId]
        );

        res.json({
            success: true,
            message: "Placement status updated successfully"
        });
    } catch (error) {
        next(error);
    }
}
