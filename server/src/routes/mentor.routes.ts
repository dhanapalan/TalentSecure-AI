// =============================================================================
// GradLogic — Mentor Routes (Phase 3)
// Assignments · Sessions · Feedback · Student Progress
// =============================================================================

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query, queryOne } from "../config/database.js";
import { sendNotification } from "../services/notification.service.js";

const router = Router();
router.use(authenticate);

// =============================================================================
// MENTOR ASSIGNMENTS
// =============================================================================

/**
 * GET /api/mentor/students
 * Mentor's assigned student list with readiness snapshot
 */
router.get("/students", authorize("mentor", "super_admin", "hr"), async (req, res, next) => {
  try {
    const mentorId = req.user!.userId;
    const isAdmin = ["super_admin", "hr"].includes(req.user!.role);

    // Admins can pass ?mentor_id; mentors always see their own
    const targetMentorId = isAdmin && req.query.mentor_id
      ? String(req.query.mentor_id)
      : mentorId;

    const rows = await query(`
      SELECT
        u.id, u.name, u.email,
        sd.degree, sd.passing_year, sd.phone,
        COALESCE(c.name, 'N/A') AS college_name,
        COALESCE(sx.total_xp, 0) AS total_xp,
        COALESCE(sx.level, 1) AS level,
        COALESCE(ps2.current_streak, 0) AS current_streak,
        ROUND(
          0.20 * LEAST(100, COALESCE(sx.total_xp, 0)::numeric / 50)
          + 0.35 * COALESCE(pss.avg_practice, 0)
          + 0.45 * COALESCE(dss.avg_drive, 0)
        , 1) AS readiness_score,
        ma.assigned_at,
        ma.notes AS assignment_notes,
        -- Last session date
        (SELECT MAX(ms.session_date) FROM mentor_sessions ms WHERE ms.student_id = u.id AND ms.mentor_id = $1) AS last_session_date,
        (SELECT COUNT(*)::int FROM mentor_sessions ms WHERE ms.student_id = u.id AND ms.mentor_id = $1) AS session_count
      FROM mentor_assignments ma
      JOIN users u ON u.id = ma.student_id
      LEFT JOIN student_details sd ON sd.user_id = u.id
      LEFT JOIN colleges c ON c.id = COALESCE(u.college_id, sd.college_id)
      LEFT JOIN student_xp sx ON sx.student_id = u.id
      LEFT JOIN practice_streaks ps2 ON ps2.student_id = u.id
      LEFT JOIN LATERAL (
        SELECT ROUND(AVG(score_percent) FILTER (WHERE status = 'completed'), 1) AS avg_practice
        FROM practice_sessions WHERE student_id = u.id
      ) pss ON TRUE
      LEFT JOIN LATERAL (
        SELECT ROUND(AVG(score) FILTER (WHERE status = 'submitted'), 1) AS avg_drive
        FROM drive_students WHERE student_id = u.id
      ) dss ON TRUE
      WHERE ma.mentor_id = $1 AND ma.is_active = TRUE
      ORDER BY readiness_score ASC
    `, [targetMentorId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/mentor/assignments
 * Assign a student to a mentor (admin only)
 */
router.post("/assignments", authorize("super_admin", "hr", "college_admin"), async (req, res, next) => {
  try {
    const { mentor_id, student_id, college_id, notes } = req.body;
    if (!mentor_id || !student_id) {
      return res.status(400).json({ error: "mentor_id and student_id required" });
    }

    const row = await queryOne(`
      INSERT INTO mentor_assignments (mentor_id, student_id, college_id, assigned_by, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (mentor_id, student_id) DO UPDATE SET is_active = TRUE, notes = EXCLUDED.notes
      RETURNING *
    `, [mentor_id, student_id, college_id || null, req.user!.userId, notes || null]);

    // Notify student
    const mentor = await queryOne("SELECT name FROM users WHERE id = $1", [mentor_id]);
    await sendNotification(
      student_id,
      "Mentor Assigned",
      `${(mentor as any)?.name} has been assigned as your mentor.`,
      "info"
    );

    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/mentor/assignments/:studentId
 * Unassign a student from the mentor
 */
router.delete("/assignments/:studentId", authorize("super_admin", "hr", "college_admin"), async (req, res, next) => {
  try {
    const { mentor_id } = req.body;
    await queryOne(`
      UPDATE mentor_assignments SET is_active = FALSE
      WHERE mentor_id = $1 AND student_id = $2
    `, [mentor_id, req.params.studentId]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// =============================================================================
// SESSIONS
// =============================================================================

/**
 * GET /api/mentor/sessions
 * List all sessions logged by this mentor (optionally filtered by student)
 */
router.get("/sessions", authorize("mentor", "super_admin", "hr"), async (req, res, next) => {
  try {
    const mentorId = req.user!.userId;
    const { student_id } = req.query as Record<string, string>;

    const rows = await query(`
      SELECT ms.*, u.name AS student_name, sd.degree, sd.passing_year
      FROM mentor_sessions ms
      JOIN users u ON u.id = ms.student_id
      LEFT JOIN student_details sd ON sd.user_id = ms.student_id
      WHERE ms.mentor_id = $1
        ${student_id ? "AND ms.student_id = $2" : ""}
      ORDER BY ms.session_date DESC, ms.created_at DESC
      LIMIT 50
    `, student_id ? [mentorId, student_id] : [mentorId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/mentor/sessions
 * Log a new session
 */
router.post("/sessions", authorize("mentor"), async (req, res, next) => {
  try {
    const {
      student_id,
      session_type = "one_on_one",
      duration_mins = 30,
      notes,
      feedback,
      action_items = [],
      session_date,
    } = req.body;

    if (!student_id) return res.status(400).json({ error: "student_id required" });

    const mentorId = req.user!.userId;

    // Verify assignment
    const assignment = await queryOne(
      "SELECT id FROM mentor_assignments WHERE mentor_id = $1 AND student_id = $2 AND is_active = TRUE",
      [mentorId, student_id]
    );
    if (!assignment) {
      return res.status(403).json({ error: "Student is not assigned to you" });
    }

    const session = await queryOne(`
      INSERT INTO mentor_sessions
        (mentor_id, student_id, session_type, duration_mins, notes, feedback, action_items, session_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      mentorId, student_id, session_type, duration_mins,
      notes || null, feedback || null,
      JSON.stringify(action_items),
      session_date || new Date().toISOString().slice(0, 10),
    ]);

    // Notify student if feedback is shared
    if (feedback) {
      const mentor = await queryOne("SELECT name FROM users WHERE id = $1", [mentorId]);
      await sendNotification(
        student_id,
        "Mentor Feedback",
        `${(mentor as any)?.name} shared feedback from your session.`,
        "success"
      );
    }

    res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
});

/**
 * PUT /api/mentor/sessions/:id
 * Update session notes, feedback, or action items
 */
router.put("/sessions/:id", authorize("mentor"), async (req, res, next) => {
  try {
    const { notes, feedback, action_items, duration_mins } = req.body;

    const session = await queryOne(`
      UPDATE mentor_sessions SET
        notes        = COALESCE($1, notes),
        feedback     = COALESCE($2, feedback),
        action_items = COALESCE($3, action_items),
        duration_mins= COALESCE($4, duration_mins),
        updated_at   = NOW()
      WHERE id = $5 AND mentor_id = $6
      RETURNING *
    `, [
      notes || null,
      feedback || null,
      action_items ? JSON.stringify(action_items) : null,
      duration_mins || null,
      req.params.id,
      req.user!.userId,
    ]);

    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ success: true, data: session });
  } catch (err) { next(err); }
});

// =============================================================================
// STUDENT DETAIL (mentor view)
// =============================================================================

/**
 * GET /api/mentor/students/:studentId
 * Full progress view for a single assigned student
 */
router.get("/students/:studentId", authorize("mentor", "super_admin", "hr"), async (req, res, next) => {
  try {
    const mentorId = req.user!.userId;
    const { studentId } = req.params;
    const isAdmin = ["super_admin", "hr"].includes(req.user!.role);

    if (!isAdmin) {
      const assignment = await queryOne(
        "SELECT id FROM mentor_assignments WHERE mentor_id = $1 AND student_id = $2 AND is_active = TRUE",
        [mentorId, studentId]
      );
      if (!assignment) return res.status(403).json({ error: "Student not assigned to you" });
    }

    const [profile, recentSessions, driveHistory, practiceStats, goals, badges] = await Promise.all([
      queryOne(`
        SELECT u.name, u.email, sd.degree, sd.passing_year, sd.phone,
               COALESCE(c.name, 'N/A') AS college_name,
               COALESCE(sx.total_xp, 0) AS total_xp, COALESCE(sx.level, 1) AS level,
               COALESCE(ps2.current_streak, 0) AS current_streak,
               COALESCE(ps2.longest_streak, 0) AS longest_streak
        FROM users u
        LEFT JOIN student_details sd ON sd.user_id = u.id
        LEFT JOIN colleges c ON c.id = COALESCE(u.college_id, sd.college_id)
        LEFT JOIN student_xp sx ON sx.student_id = u.id
        LEFT JOIN practice_streaks ps2 ON ps2.student_id = u.id
        WHERE u.id = $1
      `, [studentId]),

      query(`
        SELECT id, session_type, duration_mins, feedback, action_items, session_date, notes
        FROM mentor_sessions
        WHERE mentor_id = $1 AND student_id = $2
        ORDER BY session_date DESC LIMIT 5
      `, [mentorId, studentId]),

      query(`
        SELECT ad.name, ds.score, ds.rank, ds.status, ad.scheduled_at
        FROM drive_students ds
        JOIN assessment_drives ad ON ad.id = ds.drive_id
        WHERE ds.student_id = $1
        ORDER BY ad.scheduled_at DESC LIMIT 8
      `, [studentId]),

      queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_sessions,
          ROUND(AVG(score_percent) FILTER (WHERE status = 'completed'), 1) AS avg_score,
          MAX(score_percent) AS best_score,
          COUNT(DISTINCT topic) FILTER (WHERE status = 'completed' AND topic IS NOT NULL)::int AS topics_practiced
        FROM practice_sessions WHERE student_id = $1
      `, [studentId]),

      query(
        "SELECT title, target_role, status, progress_percent FROM student_goals WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5",
        [studentId]
      ),

      query(`
        SELECT bd.slug, bd.name, bd.icon, bd.category, sb.awarded_at
        FROM student_badges sb JOIN badge_definitions bd ON bd.id = sb.badge_id
        WHERE sb.student_id = $1 ORDER BY sb.awarded_at DESC LIMIT 6
      `, [studentId]),
    ]);

    res.json({
      success: true,
      data: { profile, recent_sessions: recentSessions, drive_history: driveHistory, practice: practiceStats, goals, badges },
    });
  } catch (err) { next(err); }
});

// =============================================================================
// MENTOR OVERVIEW (admin: list all mentors + their student counts)
// =============================================================================

/**
 * GET /api/mentor/overview
 * Admin view — all mentors, their assigned students and avg readiness
 */
router.get("/overview", authorize("super_admin", "hr", "college_admin"), async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT
        u.id, u.name, u.email,
        COUNT(ma.student_id)::int AS student_count,
        COUNT(ms.id)::int AS total_sessions,
        MAX(ms.session_date) AS last_session_date
      FROM users u
      LEFT JOIN mentor_assignments ma ON ma.mentor_id = u.id AND ma.is_active = TRUE
      LEFT JOIN mentor_sessions ms ON ms.mentor_id = u.id
      WHERE u.role = 'mentor'
      GROUP BY u.id, u.name, u.email
      ORDER BY student_count DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

export default router;
