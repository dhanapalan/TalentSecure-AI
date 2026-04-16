import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query, queryOne } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticate);

const ADMIN_ROLES = ["super_admin", "hr"] as const;
const VIEW_ROLES  = ["super_admin", "hr", "cxo", "engineer", "college_admin", "college_staff"] as const;

// ── Zod schemas ───────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().optional(),
  icon:        z.string().optional(),
});

const skillSchema = z.object({
  name:        z.string().min(1).max(150),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  level:       z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  is_active:   z.boolean().optional(),
});

const prerequisiteSchema = z.object({
  prerequisite_skill_id: z.string().uuid(),
});

// =============================================================================
// SKILL CATEGORIES
// =============================================================================

// GET /api/skills/categories
router.get("/categories", authorize(...VIEW_ROLES), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT sc.*, COUNT(s.id)::int AS skill_count
       FROM skill_categories sc
       LEFT JOIN skills s ON s.category_id = sc.id
       GROUP BY sc.id
       ORDER BY sc.name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/skills/categories
router.post("/categories", authorize(...ADMIN_ROLES), validate(categorySchema), async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const row = await queryOne(
      `INSERT INTO skill_categories (id, name, description, icon)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [uuidv4(), name, description ?? null, icon ?? null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ success: false, error: "Category name already exists" });
    next(err);
  }
});

// PUT /api/skills/categories/:id
router.put("/categories/:id", authorize(...ADMIN_ROLES), validate(categorySchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;
    const allowed = ["name", "description", "icon"];
    const sets: string[] = [];
    const vals: unknown[] = [];
    allowed.forEach((k) => {
      if (k in fields) { sets.push(`${k} = $${vals.length + 1}`); vals.push(fields[k]); }
    });
    if (!sets.length) return res.status(400).json({ success: false, error: "No fields to update" });
    vals.push(id);
    const row = await queryOne(
      `UPDATE skill_categories SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!row) return res.status(404).json({ success: false, error: "Category not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// DELETE /api/skills/categories/:id
router.delete("/categories/:id", authorize("super_admin"), async (req, res, next) => {
  try {
    const result = await query("DELETE FROM skill_categories WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.length) return res.status(404).json({ success: false, error: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  } catch (err) { next(err); }
});

// =============================================================================
// SKILLS
// =============================================================================

// GET /api/skills  (optional ?category_id=&level=&active=)
router.get("/", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const { category_id, level, active } = req.query;
    const conditions: string[] = [];
    const vals: unknown[] = [];

    if (category_id) { conditions.push(`s.category_id = $${vals.length + 1}`); vals.push(category_id); }
    if (level)       { conditions.push(`s.level = $${vals.length + 1}`);       vals.push(level); }
    if (active !== undefined) { conditions.push(`s.is_active = $${vals.length + 1}`); vals.push(active === "true"); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT s.*, sc.name AS category_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', p.id, 'name', p.name))
                 FROM skill_prerequisites sp
                 JOIN skills p ON p.id = sp.prerequisite_skill_id
                 WHERE sp.skill_id = s.id), '[]'
              ) AS prerequisites
       FROM skills s
       LEFT JOIN skill_categories sc ON sc.id = s.category_id
       ${where}
       ORDER BY sc.name ASC NULLS LAST, s.name ASC`,
      vals
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/skills/:id
router.get("/:id", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const row = await queryOne(
      `SELECT s.*, sc.name AS category_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', p.id, 'name', p.name, 'level', p.level))
                 FROM skill_prerequisites sp
                 JOIN skills p ON p.id = sp.prerequisite_skill_id
                 WHERE sp.skill_id = s.id), '[]'
              ) AS prerequisites,
              COALESCE(
                (SELECT json_agg(json_build_object('id', m.id, 'title', m.title, 'module_type', m.module_type))
                 FROM learning_modules m WHERE m.skill_id = s.id AND m.is_published = TRUE), '[]'
              ) AS modules
       FROM skills s
       LEFT JOIN skill_categories sc ON sc.id = s.category_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: "Skill not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// POST /api/skills
router.post("/", authorize(...ADMIN_ROLES), validate(skillSchema), async (req, res, next) => {
  try {
    const { name, category_id, description, level, is_active } = req.body;
    const row = await queryOne(
      `INSERT INTO skills (id, name, category_id, description, level, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), name, category_id ?? null, description ?? null, level ?? null, is_active ?? true]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

// PUT /api/skills/:id
router.put("/:id", authorize(...ADMIN_ROLES), validate(skillSchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;
    const allowed = ["name", "category_id", "description", "level", "is_active"];
    const sets: string[] = [];
    const vals: unknown[] = [];
    allowed.forEach((k) => {
      if (k in fields) { sets.push(`${k} = $${vals.length + 1}`); vals.push(fields[k]); }
    });
    if (!sets.length) return res.status(400).json({ success: false, error: "No fields to update" });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const row = await queryOne(
      `UPDATE skills SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!row) return res.status(404).json({ success: false, error: "Skill not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// DELETE /api/skills/:id
router.delete("/:id", authorize("super_admin"), async (req, res, next) => {
  try {
    const result = await query("DELETE FROM skills WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.length) return res.status(404).json({ success: false, error: "Skill not found" });
    res.json({ success: true, message: "Skill deleted" });
  } catch (err) { next(err); }
});

// =============================================================================
// PREREQUISITES
// =============================================================================

// POST /api/skills/:id/prerequisites
router.post("/:id/prerequisites", authorize(...ADMIN_ROLES), validate(prerequisiteSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prerequisite_skill_id } = req.body;

    const skill = await queryOne("SELECT id FROM skills WHERE id = $1", [id]);
    if (!skill) return res.status(404).json({ success: false, error: "Skill not found" });

    const prereq = await queryOne("SELECT id FROM skills WHERE id = $1", [prerequisite_skill_id]);
    if (!prereq) return res.status(404).json({ success: false, error: "Prerequisite skill not found" });

    await query(
      `INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, prerequisite_skill_id]
    );
    res.status(201).json({ success: true, message: "Prerequisite added" });
  } catch (err) { next(err); }
});

// DELETE /api/skills/:id/prerequisites/:prereqId
router.delete("/:id/prerequisites/:prereqId", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { id, prereqId } = req.params;
    await query(
      "DELETE FROM skill_prerequisites WHERE skill_id = $1 AND prerequisite_skill_id = $2",
      [id, prereqId]
    );
    res.json({ success: true, message: "Prerequisite removed" });
  } catch (err) { next(err); }
});

export default router;
