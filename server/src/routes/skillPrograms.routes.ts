import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query, queryOne, pool } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticate);

const ADMIN_ROLES = ["super_admin", "hr"] as const;
const VIEW_ROLES  = ["super_admin", "hr", "cxo", "engineer", "college_admin", "college_staff"] as const;

// ── Zod schemas ───────────────────────────────────────────────────────────────

const programSchema = z.object({
  name:             z.string().min(1).max(255),
  description:      z.string().optional(),
  program_type:     z.enum(["learning_path", "bootcamp", "workshop", "certification"]),
  target_skill_ids: z.array(z.string().uuid()).optional().default([]),
  eligibility_rules:z.record(z.unknown()).optional().default({}),
  duration_days:    z.number().int().positive().optional().nullable(),
  banner_url:       z.string().url().optional().nullable(),
  is_active:        z.boolean().optional(),
  college_id:       z.string().uuid().optional().nullable(),
});

const modulesOrderSchema = z.object({
  modules: z.array(z.object({
    module_id:     z.string().uuid(),
    sequence_order:z.number().int().min(1),
    is_mandatory:  z.boolean().optional().default(true),
  })).min(1),
});

// =============================================================================
// LIST
// =============================================================================

// GET /api/skill-programs  (?type=&active=&college_id=&search=)
router.get("/", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const { type, active, college_id, search } = req.query;
    const userRole = req.user?.role;
    const userCollegeId = req.user?.college_id;

    const conditions: string[] = [];
    const vals: unknown[] = [];

    // College-scoped users only see their programs + global programs
    if (!["super_admin", "hr", "cxo", "engineer"].includes(userRole ?? "")) {
      conditions.push(`(sp.college_id = $${vals.length + 1} OR sp.college_id IS NULL)`);
      vals.push(userCollegeId);
    } else if (college_id) {
      conditions.push(`sp.college_id = $${vals.length + 1}`);
      vals.push(college_id);
    }

    if (type)   { conditions.push(`sp.program_type = $${vals.length + 1}`); vals.push(type); }
    if (active !== undefined) {
      conditions.push(`sp.is_active = $${vals.length + 1}`);
      vals.push(active === "true");
    }
    if (search) {
      conditions.push(`(sp.name ILIKE $${vals.length + 1} OR sp.description ILIKE $${vals.length + 1})`);
      vals.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT sp.*,
              c.name AS college_name,
              u.name AS created_by_name,
              (SELECT COUNT(*)::int FROM program_modules pm WHERE pm.program_id = sp.id) AS module_count,
              (SELECT COUNT(*)::int FROM student_program_enrollments e WHERE e.program_id = sp.id) AS enrollment_count
       FROM skill_programs sp
       LEFT JOIN colleges c ON c.id = sp.college_id
       LEFT JOIN users u ON u.id = sp.created_by
       ${where}
       ORDER BY sp.created_at DESC`,
      vals
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// =============================================================================
// DETAIL
// =============================================================================

// GET /api/skill-programs/:id
router.get("/:id", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const program = await queryOne(
      `SELECT sp.*, c.name AS college_name, u.name AS created_by_name
       FROM skill_programs sp
       LEFT JOIN colleges c ON c.id = sp.college_id
       LEFT JOIN users u ON u.id = sp.created_by
       WHERE sp.id = $1`,
      [req.params.id]
    );
    if (!program) return res.status(404).json({ success: false, error: "Program not found" });

    const modules = await query(
      `SELECT pm.*, m.title, m.module_type, m.duration_minutes, m.difficulty, m.is_published,
              s.name AS skill_name
       FROM program_modules pm
       JOIN learning_modules m ON m.id = pm.module_id
       LEFT JOIN skills s ON s.id = m.skill_id
       WHERE pm.program_id = $1
       ORDER BY pm.sequence_order ASC`,
      [req.params.id]
    );

    const stats = await queryOne(
      `SELECT
         COUNT(*)::int AS total_enrollments,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completions,
         COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
         COALESCE(AVG(completion_score), 0)::float AS avg_completion_score
       FROM student_program_enrollments WHERE program_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...program, modules, stats } });
  } catch (err) { next(err); }
});

// =============================================================================
// CREATE
// =============================================================================

// POST /api/skill-programs
router.post("/", authorize(...ADMIN_ROLES), validate(programSchema), async (req, res, next) => {
  try {
    const {
      name, description, program_type, target_skill_ids,
      eligibility_rules, duration_days, banner_url, is_active, college_id,
    } = req.body;

    const row = await queryOne(
      `INSERT INTO skill_programs
         (id, name, description, program_type, target_skill_ids, eligibility_rules,
          duration_days, banner_url, is_active, college_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        uuidv4(), name, description ?? null, program_type,
        target_skill_ids ?? [], JSON.stringify(eligibility_rules ?? {}),
        duration_days ?? null, banner_url ?? null,
        is_active ?? true, college_id ?? null, req.user!.userId,
      ]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// UPDATE
// =============================================================================

// PUT /api/skill-programs/:id
router.put("/:id", authorize(...ADMIN_ROLES), validate(programSchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;
    const allowed = [
      "name", "description", "program_type", "target_skill_ids",
      "eligibility_rules", "duration_days", "banner_url", "is_active", "college_id",
    ];
    const sets: string[] = [];
    const vals: unknown[] = [];
    allowed.forEach((k) => {
      if (k in fields) {
        sets.push(`${k} = $${vals.length + 1}`);
        vals.push(k === "eligibility_rules" ? JSON.stringify(fields[k]) : fields[k]);
      }
    });
    if (!sets.length) return res.status(400).json({ success: false, error: "No fields to update" });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const row = await queryOne(
      `UPDATE skill_programs SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!row) return res.status(404).json({ success: false, error: "Program not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// DELETE /api/skill-programs/:id
router.delete("/:id", authorize("super_admin"), async (req, res, next) => {
  try {
    const result = await query("DELETE FROM skill_programs WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.length) return res.status(404).json({ success: false, error: "Program not found" });
    res.json({ success: true, message: "Program deleted" });
  } catch (err) { next(err); }
});

// =============================================================================
// MODULE ORDERING (replace all modules in a program atomically)
// =============================================================================

// PUT /api/skill-programs/:id/modules
router.put("/:id/modules", authorize(...ADMIN_ROLES), validate(modulesOrderSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { modules } = req.body as { modules: { module_id: string; sequence_order: number; is_mandatory: boolean }[] };

    const program = await queryOne("SELECT id FROM skill_programs WHERE id = $1", [id]);
    if (!program) return res.status(404).json({ success: false, error: "Program not found" });

    await client.query("BEGIN");
    await client.query("DELETE FROM program_modules WHERE program_id = $1", [id]);

    for (const m of modules) {
      await client.query(
        `INSERT INTO program_modules (id, program_id, module_id, sequence_order, is_mandatory)
         VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), id, m.module_id, m.sequence_order, m.is_mandatory ?? true]
      );
    }

    await client.query("COMMIT");

    const updated = await query(
      `SELECT pm.*, m.title, m.module_type, m.duration_minutes, m.difficulty
       FROM program_modules pm
       JOIN learning_modules m ON m.id = pm.module_id
       WHERE pm.program_id = $1
       ORDER BY pm.sequence_order ASC`,
      [id]
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/skill-programs/:id/modules  (add a single module)
router.post("/:id/modules", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { module_id, sequence_order, is_mandatory } = req.body;

    if (!module_id) return res.status(400).json({ success: false, error: "module_id is required" });

    const maxOrder = await queryOne<{ max: number }>(
      "SELECT COALESCE(MAX(sequence_order), 0)::int AS max FROM program_modules WHERE program_id = $1",
      [id]
    );

    await queryOne(
      `INSERT INTO program_modules (id, program_id, module_id, sequence_order, is_mandatory)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (program_id, module_id) DO UPDATE
         SET sequence_order = EXCLUDED.sequence_order, is_mandatory = EXCLUDED.is_mandatory
       RETURNING *`,
      [uuidv4(), id, module_id, sequence_order ?? (maxOrder!.max + 1), is_mandatory ?? true]
    );

    res.status(201).json({ success: true, message: "Module added to program" });
  } catch (err) { next(err); }
});

// DELETE /api/skill-programs/:id/modules/:moduleId
router.delete("/:id/modules/:moduleId", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    await query(
      "DELETE FROM program_modules WHERE program_id = $1 AND module_id = $2",
      [req.params.id, req.params.moduleId]
    );
    res.json({ success: true, message: "Module removed from program" });
  } catch (err) { next(err); }
});

// =============================================================================
// STUDENT ENROLLMENT
// =============================================================================

// POST /api/skill-programs/:id/enroll  (enroll self as student)
router.post("/:id/enroll", authorize("student"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const student = await queryOne("SELECT id FROM student_details WHERE user_id = $1", [userId]);
    if (!student) return res.status(404).json({ success: false, error: "Student profile not found" });

    const program = await queryOne("SELECT id, is_active FROM skill_programs WHERE id = $1", [id]);
    if (!program) return res.status(404).json({ success: false, error: "Program not found" });
    if (!program.is_active) return res.status(400).json({ success: false, error: "Program is not active" });

    const enrollment = await queryOne(
      `INSERT INTO student_program_enrollments (id, student_id, program_id, status)
       VALUES ($1,$2,$3,'enrolled')
       ON CONFLICT (student_id, program_id) DO NOTHING
       RETURNING *`,
      [uuidv4(), student.id, id]
    );

    if (!enrollment) return res.status(409).json({ success: false, error: "Already enrolled in this program" });
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) { next(err); }
});

// GET /api/skill-programs/:id/enrollments  (admin: list all enrollments)
router.get("/:id/enrollments", authorize(...ADMIN_ROLES, "cxo"), async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.*, sd.full_name AS student_name, sd.email AS student_email,
              c.name AS college_name
       FROM student_program_enrollments e
       JOIN student_details sd ON sd.id = e.student_id
       LEFT JOIN colleges c ON c.id = sd.college_id
       WHERE e.program_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

export default router;
