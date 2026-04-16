import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query, queryOne, pool } from "../config/database.js";

const router = Router();
router.use(authenticate);

const COLLEGE_ROLES = ["college_admin", "college", "college_staff"] as const;

// ── GET /api/college-skills/overview
// Summary stats: enrolled students, programs, completions
router.get("/overview", authorize(...COLLEGE_ROLES), async (req, res, next) => {
  try {
    const collegeId = req.user!.college_id;
    if (!collegeId) return res.status(403).json({ success: false, error: "Not linked to a college" });

    const stats = await queryOne(`
      SELECT
        COUNT(DISTINCT sd.id)::int                                                  AS total_students,
        COUNT(DISTINCT spe.id)::int                                                 AS total_enrollments,
        COUNT(DISTINCT spe.id) FILTER (WHERE spe.status = 'completed')::int        AS completions,
        COUNT(DISTINCT spe.program_id)::int                                         AS programs_accessed,
        COALESCE(ROUND(AVG(spe.completion_score)::numeric, 1), 0)                  AS avg_score,
        COUNT(DISTINCT ss.skill_id)::int                                            AS skills_acquired
      FROM student_details sd
      LEFT JOIN student_program_enrollments spe ON spe.student_id = sd.id
      LEFT JOIN student_skills ss ON ss.student_id = sd.id
      WHERE sd.college_id = $1
    `, [collegeId]);

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// ── GET /api/college-skills/programs
// Programs enrolled by college students with stats
router.get("/programs", authorize(...COLLEGE_ROLES), async (req, res, next) => {
  try {
    const collegeId = req.user!.college_id;
    if (!collegeId) return res.status(403).json({ success: false, error: "Not linked to a college" });

    const rows = await query(`
      SELECT
        sp.id, sp.name, sp.program_type, sp.duration_days,
        COUNT(DISTINCT spe.id)::int                                                   AS enrolled_students,
        COUNT(DISTINCT spe.id) FILTER (WHERE spe.status = 'completed')::int           AS completed_students,
        COALESCE(ROUND(AVG(spe.completion_score)::numeric, 1), 0)                     AS avg_score,
        COALESCE(ROUND(
          COUNT(DISTINCT spe.id) FILTER (WHERE spe.status = 'completed')::numeric
          / NULLIF(COUNT(DISTINCT spe.id), 0) * 100, 1
        ), 0)                                                                          AS completion_rate
      FROM skill_programs sp
      JOIN student_program_enrollments spe ON spe.program_id = sp.id
      JOIN student_details sd ON sd.id = spe.student_id
      WHERE sd.college_id = $1
      GROUP BY sp.id, sp.name, sp.program_type, sp.duration_days
      ORDER BY enrolled_students DESC
    `, [collegeId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── GET /api/college-skills/students
// Per-student skill progress
router.get("/students", authorize(...COLLEGE_ROLES), async (req, res, next) => {
  try {
    const collegeId = req.user!.college_id;
    if (!collegeId) return res.status(403).json({ success: false, error: "Not linked to a college" });

    const rows = await query(`
      SELECT
        sd.id AS student_id,
        u.name AS student_name,
        u.email,
        sd.department, sd.year_of_study,
        COUNT(DISTINCT spe.id)::int                                                   AS enrolled_programs,
        COUNT(DISTINCT spe.id) FILTER (WHERE spe.status = 'completed')::int           AS completed_programs,
        COUNT(DISTINCT ss.skill_id)::int                                              AS skills_acquired,
        COALESCE(ROUND(AVG(spe.completion_score)::numeric, 1), 0)                     AS avg_score
      FROM student_details sd
      JOIN users u ON u.id = sd.id
      LEFT JOIN student_program_enrollments spe ON spe.student_id = sd.id
      LEFT JOIN student_skills ss ON ss.student_id = sd.id
      WHERE sd.college_id = $1
      GROUP BY sd.id, u.name, u.email, sd.department, sd.year_of_study
      ORDER BY skills_acquired DESC, completed_programs DESC
    `, [collegeId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── GET /api/college-skills/skill-gap
// Skills covered vs missing across college students
router.get("/skill-gap", authorize(...COLLEGE_ROLES), async (req, res, next) => {
  try {
    const collegeId = req.user!.college_id;
    if (!collegeId) return res.status(403).json({ success: false, error: "Not linked to a college" });

    const totalStudents = await queryOne(
      `SELECT COUNT(*)::int AS cnt FROM student_details WHERE college_id = $1`, [collegeId]
    );
    const total = totalStudents?.cnt || 1;

    const rows = await query(`
      SELECT
        s.id, s.name AS skill_name, s.skill_level,
        sc.name AS category_name,
        COUNT(DISTINCT ss.student_id)::int AS students_with_skill,
        ROUND(COUNT(DISTINCT ss.student_id)::numeric / $2 * 100, 1) AS coverage_pct,
        COALESCE(ROUND(AVG(ss.proficiency_score)::numeric, 1), 0) AS avg_proficiency
      FROM skills s
      LEFT JOIN skill_categories sc ON sc.id = s.category_id
      LEFT JOIN student_skills ss ON ss.skill_id = s.id
        AND ss.student_id IN (SELECT id FROM student_details WHERE college_id = $1)
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name, s.skill_level, sc.name
      ORDER BY coverage_pct ASC
    `, [collegeId, total]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── POST /api/college-skills/batch-enroll
// Enroll all college students into a program
router.post("/batch-enroll", authorize("college_admin", "college"), async (req, res, next) => {
  try {
    const collegeId = req.user!.college_id;
    if (!collegeId) return res.status(403).json({ success: false, error: "Not linked to a college" });

    const { program_id } = req.body;
    if (!program_id) return res.status(400).json({ success: false, error: "program_id required" });

    const program = await queryOne(`SELECT id, is_active FROM skill_programs WHERE id = $1`, [program_id]);
    if (!program) return res.status(404).json({ success: false, error: "Program not found" });
    if (!program.is_active) return res.status(400).json({ success: false, error: "Program is not active" });

    // Get all students in college not yet enrolled
    const students = await query(`
      SELECT sd.id FROM student_details sd
      WHERE sd.college_id = $1
        AND sd.id NOT IN (
          SELECT student_id FROM student_program_enrollments WHERE program_id = $2
        )
    `, [collegeId, program_id]);

    if (students.length === 0) {
      return res.json({ success: true, enrolled: 0, message: "All students already enrolled" });
    }

    const { v4: uuidv4 } = await import("uuid");
    const values = students.map((s: any) =>
      `('${uuidv4()}', '${s.id}', '${program_id}', 'enrolled', NOW())`
    ).join(", ");

    await pool.query(`
      INSERT INTO student_program_enrollments (id, student_id, program_id, status, enrolled_at)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);

    res.json({ success: true, enrolled: students.length, message: `${students.length} students enrolled` });
  } catch (err) { next(err); }
});

export default router;
