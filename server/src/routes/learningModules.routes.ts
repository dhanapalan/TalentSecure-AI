import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query, queryOne } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticate);

const ADMIN_ROLES = ["super_admin", "hr"] as const;
const VIEW_ROLES  = ["super_admin", "hr", "cxo", "engineer", "college_admin", "college_staff", "student"] as const;

// ── Zod schemas ───────────────────────────────────────────────────────────────

const moduleSchema = z.object({
  title:           z.string().min(1).max(255),
  description:     z.string().optional(),
  module_type:     z.enum(["video", "coding_exercise", "quiz", "reading", "soft_skill", "live_session"]),
  skill_id:        z.string().uuid().optional().nullable(),
  content_url:     z.string().url().optional().nullable(),
  content_body:    z.string().optional().nullable(),
  duration_minutes:z.number().int().positive().optional().nullable(),
  difficulty:      z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  passing_score:   z.number().min(0).max(100).optional(),
  is_published:    z.boolean().optional(),
});

// =============================================================================
// LIST
// =============================================================================

// GET /api/learning-modules  (?type=&skill_id=&published=&search=)
router.get("/", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const { type, skill_id, published, search } = req.query;
    const conditions: string[] = [];
    const vals: unknown[] = [];

    if (type)       { conditions.push(`m.module_type = $${vals.length + 1}`);   vals.push(type); }
    if (skill_id)   { conditions.push(`m.skill_id = $${vals.length + 1}`);       vals.push(skill_id); }
    if (published !== undefined) {
      conditions.push(`m.is_published = $${vals.length + 1}`);
      vals.push(published === "true");
    }
    if (search) {
      conditions.push(`(m.title ILIKE $${vals.length + 1} OR m.description ILIKE $${vals.length + 1})`);
      vals.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT m.*, s.name AS skill_name, sc.name AS category_name,
              u.name AS created_by_name
       FROM learning_modules m
       LEFT JOIN skills s ON s.id = m.skill_id
       LEFT JOIN skill_categories sc ON sc.id = s.category_id
       LEFT JOIN users u ON u.id = m.created_by
       ${where}
       ORDER BY m.created_at DESC`,
      vals
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// =============================================================================
// DETAIL
// =============================================================================

// GET /api/learning-modules/:id
router.get("/:id", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const row = await queryOne(
      `SELECT m.*, s.name AS skill_name, sc.name AS category_name,
              u.name AS created_by_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                    'program_id', pm.program_id,
                    'program_name', sp.name,
                    'sequence_order', pm.sequence_order
                ) ORDER BY pm.sequence_order)
                 FROM program_modules pm
                 JOIN skill_programs sp ON sp.id = pm.program_id
                 WHERE pm.module_id = m.id), '[]'
              ) AS used_in_programs
       FROM learning_modules m
       LEFT JOIN skills s ON s.id = m.skill_id
       LEFT JOIN skill_categories sc ON sc.id = s.category_id
       LEFT JOIN users u ON u.id = m.created_by
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: "Module not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// CREATE
// =============================================================================

// POST /api/learning-modules
router.post("/", authorize(...ADMIN_ROLES), validate(moduleSchema), async (req, res, next) => {
  try {
    const {
      title, description, module_type, skill_id, content_url,
      content_body, duration_minutes, difficulty, passing_score, is_published,
    } = req.body;

    const row = await queryOne(
      `INSERT INTO learning_modules
         (id, title, description, module_type, skill_id, content_url, content_body,
          duration_minutes, difficulty, passing_score, is_published, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        uuidv4(), title, description ?? null, module_type,
        skill_id ?? null, content_url ?? null, content_body ?? null,
        duration_minutes ?? null, difficulty ?? null,
        passing_score ?? 60, is_published ?? false,
        req.user!.userId,
      ]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// UPDATE
// =============================================================================

// PUT /api/learning-modules/:id
router.put("/:id", authorize(...ADMIN_ROLES), validate(moduleSchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;
    const allowed = [
      "title", "description", "module_type", "skill_id", "content_url",
      "content_body", "duration_minutes", "difficulty", "passing_score", "is_published",
    ];
    const sets: string[] = [];
    const vals: unknown[] = [];
    allowed.forEach((k) => {
      if (k in fields) { sets.push(`${k} = $${vals.length + 1}`); vals.push(fields[k]); }
    });
    if (!sets.length) return res.status(400).json({ success: false, error: "No fields to update" });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const row = await queryOne(
      `UPDATE learning_modules SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!row) return res.status(404).json({ success: false, error: "Module not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// DELETE
// =============================================================================

// DELETE /api/learning-modules/:id
router.delete("/:id", authorize("super_admin", "hr"), async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM learning_modules WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!result.length) return res.status(404).json({ success: false, error: "Module not found" });
    res.json({ success: true, message: "Module deleted" });
  } catch (err) { next(err); }
});

// =============================================================================
// PUBLISH / UNPUBLISH (convenience toggles)
// =============================================================================

// PATCH /api/learning-modules/:id/publish
router.patch("/:id/publish", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const row = await queryOne(
      `UPDATE learning_modules SET is_published = NOT is_published, updated_at = NOW()
       WHERE id = $1 RETURNING id, title, is_published`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: "Module not found" });
    res.json({ success: true, data: row, message: row.is_published ? "Module published" : "Module unpublished" });
  } catch (err) { next(err); }
});

export default router;
