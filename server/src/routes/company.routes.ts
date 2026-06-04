// =============================================================================
// TalentSecure AI — Company Routes  (role: company)
// GET    /api/company/profile                  get/init company profile
// PUT    /api/company/profile                  update profile
// GET    /api/company/stats                    dashboard KPIs
// GET    /api/company/drives                   drives owned by this company
// GET    /api/company/candidates               all candidates across own drives
// PUT    /api/company/candidates/:dsId/stage   move candidate through pipeline
// =============================================================================

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query, queryOne } from "../config/database.js";

const router = Router();
router.use(authenticate);
router.use(authorize("company", "super_admin", "hr")); // super_admin/hr can also view

const PIPELINE_STAGES = ["pending", "shortlisted", "interview_scheduled", "offered", "rejected"] as const;
type PipelineStage = typeof PIPELINE_STAGES[number];

// ── GET /profile ─────────────────────────────────────────────────────────────
router.get("/profile", async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    // Auto-create profile on first access
    let profile = await queryOne(
      "SELECT c.*, u.name AS user_name, u.email FROM companies c JOIN users u ON u.id = c.user_id WHERE c.user_id = $1",
      [userId]
    );

    if (!profile) {
      const user = await queryOne<{ name: string; email: string }>(
        "SELECT name, email FROM users WHERE id = $1", [userId]
      );
      profile = await queryOne(
        `INSERT INTO companies (user_id, name) VALUES ($1, $2) RETURNING *`,
        [userId, (user as any)?.name || "My Company"]
      );
    }

    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PUT /profile ─────────────────────────────────────────────────────────────
router.put("/profile", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const allowed = ["name", "industry", "website", "logo_url", "description", "headquarters"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];

    for (const key of allowed) {
      if (key in req.body) {
        vals.push(req.body[key] ?? null);
        sets.push(`${key} = $${vals.length}`);
      }
    }

    if (!sets.length) return res.status(400).json({ error: "No updatable fields provided" });

    vals.push(userId);
    const updated = await queryOne(
      `UPDATE companies SET ${sets.join(", ")}, updated_at = NOW()
       WHERE user_id = $${vals.length} RETURNING *`,
      vals
    );

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*)::int
           FROM assessment_drives
           WHERE created_by = $1 AND status NOT IN ('completed','cancelled')) AS active_drives,

        (SELECT COUNT(*)::int
           FROM assessment_drives
           WHERE created_by = $1) AS total_drives,

        (SELECT COUNT(DISTINCT ds.student_id)::int
           FROM drive_students ds
           JOIN assessment_drives ad ON ad.id = ds.drive_id
           WHERE ad.created_by = $1 AND ds.status = 'completed') AS total_candidates,

        (SELECT COUNT(DISTINCT ds.student_id)::int
           FROM drive_students ds
           JOIN assessment_drives ad ON ad.id = ds.drive_id
           WHERE ad.created_by = $1 AND ds.pipeline_stage = 'shortlisted') AS shortlisted,

        (SELECT COUNT(DISTINCT ds.student_id)::int
           FROM drive_students ds
           JOIN assessment_drives ad ON ad.id = ds.drive_id
           WHERE ad.created_by = $1 AND ds.pipeline_stage = 'offered') AS offers_made,

        (SELECT ROUND(AVG(ds.score)::numeric, 1)
           FROM drive_students ds
           JOIN assessment_drives ad ON ad.id = ds.drive_id
           WHERE ad.created_by = $1 AND ds.status = 'completed'
             AND ds.score IS NOT NULL) AS avg_score
    `, [userId]);

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// ── GET /drives ───────────────────────────────────────────────────────────────
router.get("/drives", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const rows = await query(`
      SELECT
        ad.id, ad.name, ad.status, ad.scheduled_start, ad.scheduled_end,
        ad.total_students, ad.created_at,
        (SELECT COUNT(*)::int
           FROM drive_students ds WHERE ds.drive_id = ad.id AND ds.status = 'completed') AS completed_count,
        (SELECT COUNT(*)::int
           FROM drive_students ds WHERE ds.drive_id = ad.id
             AND ds.pipeline_stage = 'shortlisted') AS shortlisted_count,
        art.name AS rule_name
      FROM assessment_drives ad
      LEFT JOIN assessment_rule_templates art ON art.id = ad.rule_id
      WHERE ad.created_by = $1
      ORDER BY ad.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── GET /candidates ───────────────────────────────────────────────────────────
// Query params: drive_id, stage, min_score, limit, offset
router.get("/candidates", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { drive_id, stage, min_score, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const params: unknown[] = [userId];
    const conditions: string[] = ["ad.created_by = $1", "ds.status = 'completed'"];

    if (drive_id) {
      params.push(drive_id);
      conditions.push(`ds.drive_id = $${params.length}`);
    }
    if (stage && PIPELINE_STAGES.includes(stage as PipelineStage)) {
      params.push(stage);
      conditions.push(`ds.pipeline_stage = $${params.length}`);
    }
    if (min_score) {
      params.push(Number(min_score));
      conditions.push(`ds.score >= $${params.length}`);
    }

    params.push(parseInt(limit) || 50);
    const limitIdx = params.length;
    params.push(parseInt(offset) || 0);
    const offsetIdx = params.length;

    const rows = await query(`
      SELECT
        ds.id            AS drive_student_id,
        ds.student_id,
        ds.drive_id,
        ds.score,
        ds.pipeline_stage,
        ds.completed_at,
        ad.name          AS drive_name,
        ad.scheduled_start,
        u.name           AS student_name,
        u.email          AS student_email,
        sd.degree,
        sd.specialization,
        sd.passing_year,
        sd.cgpa,
        sd.skills,
        sd.linkedin_url,
        sd.resume_url,
        c.name           AS college_name
      FROM drive_students ds
      JOIN assessment_drives ad ON ad.id = ds.drive_id
      JOIN users u            ON u.id  = ds.student_id
      LEFT JOIN student_details sd ON sd.user_id = ds.student_id
      LEFT JOIN colleges c         ON c.id = sd.college_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ds.score DESC NULLS LAST, ds.completed_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    // Count for pagination
    const countParams = params.slice(0, params.length - 2);
    const total = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM drive_students ds
       JOIN assessment_drives ad ON ad.id = ds.drive_id
       WHERE ${conditions.join(" AND ")}`,
      countParams
    );

    res.json({ success: true, data: rows, total: (total as any)?.count ?? 0 });
  } catch (err) { next(err); }
});

// ── PUT /candidates/:dsId/stage ───────────────────────────────────────────────
router.put("/candidates/:dsId/stage", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { stage } = req.body;

    if (!PIPELINE_STAGES.includes(stage as PipelineStage)) {
      return res.status(400).json({
        error: `Invalid stage. Must be one of: ${PIPELINE_STAGES.join(", ")}`,
      });
    }

    // Verify the drive belongs to this company
    const row = await queryOne(
      `UPDATE drive_students ds SET pipeline_stage = $1
       FROM assessment_drives ad
       WHERE ds.id = $2 AND ds.drive_id = ad.id AND ad.created_by = $3
       RETURNING ds.id, ds.student_id, ds.drive_id, ds.pipeline_stage`,
      [stage, req.params.dsId, userId]
    );

    if (!row) return res.status(404).json({ error: "Candidate record not found or not in your drive" });

    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

export default router;
