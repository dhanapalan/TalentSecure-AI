import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { query, queryOne } from "../config/database.js";
import { uploadFile } from "../config/storage.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticate);

const ADMIN_ROLES = ["super_admin", "hr"] as const;
const VIEW_ROLES  = ["super_admin", "hr", "cxo"] as const;

const mouUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

// ── Zod schemas ───────────────────────────────────────────────────────────────

const partnerSchema = z.object({
  name:             z.string().min(1).max(255),
  partner_type:     z.enum(["edtech", "industry", "government", "ngo"]).optional(),
  college_id:       z.string().uuid().optional().nullable(),
  mou_status:       z.string().optional(),
  agreement_start:  z.string().datetime().optional().nullable(),
  agreement_end:    z.string().datetime().optional().nullable(),
  contact_email:    z.string().email().optional().nullable(),
  contact_name:     z.string().optional().nullable(),
  contact_phone:    z.string().optional().nullable(),
  website:          z.string().url().optional().nullable(),
  is_active:        z.boolean().optional(),
});

// =============================================================================
// LIST
// =============================================================================

// GET /api/skill-partners  (?college_id=&type=&active=)
router.get("/", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const { college_id, type, active } = req.query;
    const conditions: string[] = [];
    const vals: unknown[] = [];

    if (college_id) { conditions.push(`p.college_id = $${vals.length + 1}`); vals.push(college_id); }
    if (type)       { conditions.push(`p.partner_type = $${vals.length + 1}`); vals.push(type); }
    if (active !== undefined) {
      conditions.push(`p.is_active = $${vals.length + 1}`);
      vals.push(active === "true");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT p.*, c.name AS college_name
       FROM skill_dev_partners p
       LEFT JOIN colleges c ON c.id = p.college_id
       ${where}
       ORDER BY p.name ASC`,
      vals
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// =============================================================================
// DETAIL
// =============================================================================

// GET /api/skill-partners/:id
router.get("/:id", authorize(...VIEW_ROLES), async (req, res, next) => {
  try {
    const row = await queryOne(
      `SELECT p.*, c.name AS college_name
       FROM skill_dev_partners p
       LEFT JOIN colleges c ON c.id = p.college_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: "Partner not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// CREATE
// =============================================================================

// POST /api/skill-partners
router.post("/", authorize(...ADMIN_ROLES), validate(partnerSchema), async (req, res, next) => {
  try {
    const {
      name, partner_type, college_id, mou_status, agreement_start,
      agreement_end, contact_email, contact_name, contact_phone, website, is_active,
    } = req.body;

    const row = await queryOne(
      `INSERT INTO skill_dev_partners
         (id, name, partner_type, college_id, mou_status, agreement_start, agreement_end,
          contact_email, contact_name, contact_phone, website, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        uuidv4(), name, partner_type ?? null, college_id ?? null,
        mou_status ?? "Active", agreement_start ?? null, agreement_end ?? null,
        contact_email ?? null, contact_name ?? null, contact_phone ?? null,
        website ?? null, is_active ?? true, req.user!.userId,
      ]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

// =============================================================================
// UPDATE
// =============================================================================

// PUT /api/skill-partners/:id
router.put("/:id", authorize(...ADMIN_ROLES), validate(partnerSchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;
    const allowed = [
      "name", "partner_type", "college_id", "mou_status", "agreement_start",
      "agreement_end", "contact_email", "contact_name", "contact_phone", "website", "is_active",
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
      `UPDATE skill_dev_partners SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!row) return res.status(404).json({ success: false, error: "Partner not found" });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// DELETE /api/skill-partners/:id
router.delete("/:id", authorize("super_admin"), async (req, res, next) => {
  try {
    const result = await query("DELETE FROM skill_dev_partners WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.length) return res.status(404).json({ success: false, error: "Partner not found" });
    res.json({ success: true, message: "Partner deleted" });
  } catch (err) { next(err); }
});

// =============================================================================
// MOU UPLOAD
// =============================================================================

// POST /api/skill-partners/:id/upload-mou
router.post(
  "/:id/upload-mou",
  authorize(...ADMIN_ROLES),
  mouUpload.single("mou_file"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, error: "No PDF file provided" });

      const partner = await queryOne("SELECT id FROM skill_dev_partners WHERE id = $1", [id]);
      if (!partner) return res.status(404).json({ success: false, error: "Partner not found" });

      const key = `skill-partners/${id}/mou/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFile(key, file.buffer, file.mimetype);

      await query(
        "UPDATE skill_dev_partners SET mou_url = $1, updated_at = NOW() WHERE id = $2",
        [url, id]
      );

      res.json({ success: true, data: { mou_url: url } });
    } catch (err) { next(err); }
  }
);

// =============================================================================
// SKILL-DEV ANALYTICS  (CXO endpoints)
// =============================================================================

// GET /api/skill-partners/analytics/uplift  — skill uplift metrics for CXO
router.get("/analytics/uplift", authorize("super_admin", "hr", "cxo"), async (_req, res, next) => {
  try {
    const metrics = await queryOne(
      `SELECT
         (SELECT COUNT(*)::int FROM skill_programs WHERE is_active = TRUE)         AS active_programs,
         (SELECT COUNT(*)::int FROM student_program_enrollments)                   AS total_enrollments,
         (SELECT COUNT(*)::int FROM student_program_enrollments WHERE status = 'completed') AS completions,
         (SELECT ROUND(AVG(completion_score)::numeric, 1) FROM student_program_enrollments
          WHERE status = 'completed')                                               AS avg_completion_score,
         (SELECT COUNT(*)::int FROM learning_modules WHERE is_published = TRUE)    AS published_modules,
         (SELECT COUNT(*)::int FROM skills WHERE is_active = TRUE)                 AS active_skills,
         (SELECT COUNT(*)::int FROM skill_dev_partners WHERE is_active = TRUE)     AS active_partners`
    );
    res.json({ success: true, data: metrics });
  } catch (err) { next(err); }
});

// GET /api/skill-partners/analytics/employability  — per-campus employability index
router.get("/analytics/employability", authorize("super_admin", "hr", "cxo"), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT
         c.id AS college_id, c.name AS college_name,
         COUNT(DISTINCT sd.id)::int AS student_count,
         COUNT(DISTINCT e.id)::int AS enrolled_students,
         COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::int AS completed_students,
         COALESCE(ROUND(AVG(e.completion_score)::numeric, 1), 0) AS avg_score,
         COALESCE(ROUND(
           (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::float
            / NULLIF(COUNT(DISTINCT sd.id), 0) * 100)::numeric, 1
         ), 0) AS employability_index
       FROM colleges c
       LEFT JOIN student_details sd ON sd.college_id = c.id
       LEFT JOIN student_program_enrollments e ON e.student_id = sd.id
       WHERE c.is_active = TRUE
       GROUP BY c.id, c.name
       ORDER BY employability_index DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

export default router;
