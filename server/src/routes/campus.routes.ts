import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { query, queryOne, pool } from "../config/database.js";
import { ApiResponse } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";
import { writeAuditLog } from "../services/audit.service.js";
import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler.js";
import multer from "multer";
import { uploadFile } from "../config/storage.js";

const mouUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

const router = Router();

function getParamAsString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toCollegeCodeBase(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return (slug || "campus").slice(0, 50);
}

async function buildUniqueCollegeCode(
  client: { query: (text: string, params?: unknown[]) => Promise<{ rowCount: number }> },
  campusName: string,
): Promise<string> {
  const base = toCollegeCodeBase(campusName);

  for (let i = 0; i < 1000; i += 1) {
    const suffix = i === 0 ? "" : `.${i + 1}`;
    const maxBaseLen = 50 - suffix.length;
    const candidate = `${base.slice(0, maxBaseLen)}${suffix}`;
    const exists = await client.query(
      "SELECT 1 FROM colleges WHERE college_code = $1 LIMIT 1",
      [candidate],
    );
    if (exists.rowCount === 0) {
      return candidate;
    }
  }

  throw new AppError(
    "Unable to generate a unique college code. Please try a different campus name.",
    409,
  );
}

const createCampusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  tier: z.string().optional(),

  // Enterprise classifications
  category: z.string().optional(),
  institution_type: z.string().optional(),
  region: z.string().optional(),
  naac_grade: z.string().optional(),
  nirf_rank: z.number().int().optional(),

  adminName: z.string().min(1, "Admin full name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateCampusSchema = createCampusSchema.omit({
  adminName: true,
  adminEmail: true,
  adminPassword: true,
}).partial().extend({
  is_active: z.boolean().optional(),

  // Enterprise fields
  tier: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  institution_type: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  naac_grade: z.string().optional().nullable(),
  nirf_rank: z.number().int().optional().nullable(),

  agreement_start_date: z.string().datetime().optional().nullable(),
  agreement_end_date: z.string().datetime().optional().nullable(),
  sla: z.string().optional().nullable(),
  mou_url: z.string().optional().nullable(),
  contract_status: z.string().optional().nullable(),

  eligible_for_hiring: z.boolean().optional(),
  eligible_for_tier1: z.boolean().optional(),
  is_blacklisted: z.boolean().optional(),
  is_suspended: z.boolean().optional(),

  internal_notes: z.string().optional().nullable(),
});

const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid admin email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const bulkActionSchema = z.object({
  action: z.enum(["activate", "suspend", "assign_exam", "delete", "notify"]),
  campusIds: z.array(z.string().uuid()).min(1),
  payload: z.any().optional(),
});

// GET /api/campuses — Restrict to Central Admins
router.get(
  "/",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  async (req, res, next) => {
    try {
      const campuses = await query(`
        SELECT 
          c.*, 
          COUNT(DISTINCT sd.id)::int as student_count,
          (SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.college_id = c.id AND u.role IN ('college_admin', 'college'))::int as admin_count,
          (SELECT COUNT(DISTINCT ec.id) FROM exam_colleges ec WHERE ec.college_id = c.id)::int as assessments_count,
          COALESCE((SELECT AVG(ms.final_score) FROM marks_scored ms JOIN student_details s ON s.user_id = ms.student_id WHERE s.college_id = c.id), 0)::float as avg_score,
          COALESCE((SELECT AVG(cl.risk_score) FROM cheating_logs cl JOIN student_details s ON s.user_id = cl.student_id WHERE s.college_id = c.id), 0)::float as avg_risk_score,
          (SELECT COUNT(DISTINCT cl.id) FROM cheating_logs cl JOIN student_details s ON s.user_id = cl.student_id WHERE s.college_id = c.id)::int as incident_count
        FROM colleges c
        LEFT JOIN student_details sd ON sd.college_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `);

      res.json({ success: true, data: campuses });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campuses
 * Create a new campus (Central Admin/HR only)
 */
router.post(
  "/",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  validate(createCampusSchema),
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { name, city, state, tier, adminName, adminEmail, adminPassword } = req.body;

      // Check if email already exists
      const existingUser = await queryOne("SELECT id FROM users WHERE email = $1", [adminEmail]);
      if (existingUser) {
        return res.status(409).json({ success: false, error: "Admin email already in use" });
      }

      const id = uuidv4();
      await client.query("BEGIN");
      const collegeCode = await buildUniqueCollegeCode(client, name);

      // 1. Create Campus (colleges table)
      const campusResult = await client.query(
        `INSERT INTO colleges (
          id, name, city, state, tier, college_code, country, 
          category, institution_type, region, naac_grade, nirf_rank, 
          created_at, is_active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), TRUE)
         RETURNING *`,
        [
          id, name, city, state, tier || null, collegeCode, "India",
          req.body.category || null, req.body.institution_type || null,
          req.body.region || null, req.body.naac_grade || null, req.body.nirf_rank || null
        ]
      );
      const campus = campusResult.rows[0];

      // 2. Create Admin User
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const adminDisplayName = adminName.trim();

      await client.query(
        `INSERT INTO users (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password)
         VALUES ('college_admin', $1, $2, $3, $4, TRUE, TRUE, TRUE)`,
        [adminDisplayName, adminEmail, hashedPassword, id]
      );

      await client.query("COMMIT");

      // 3. Send Invitation Email
      import("../services/email.service.js").then(m => {
        m.sendCampusAdminInvitation({
          adminName: adminDisplayName,
          adminEmail,
          campusName: name,
          temporaryPassword: adminPassword
        }).catch(err => {
          console.error("Failed to send campus admin invitation email:", err);
        });
      });

      // Audit log
      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: "CAMPUS_CREATED",
        target_type: "campus",
        target_id: id,
        reason: `Created campus: ${name} with admin: ${adminEmail}`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => { });

      res.status(201).json({ success: true, data: campus });
    } catch (err) {
      await client.query("ROLLBACK");
      const dbErr = err as { code?: string; constraint?: string };
      if (dbErr.code === "23505" && dbErr.constraint === "users_email_key") {
        return res
          .status(409)
          .json({ success: false, error: "Admin email already in use" });
      }
      next(err);
    } finally {
      client.release();
    }
  }
);

// Whitelist of columns that can be updated on a campus record.
// Must be kept in sync with updateCampusSchema.
const ALLOWED_CAMPUS_UPDATE_KEYS = new Set([
  "name", "city", "state", "tier", "category", "institution_type", "region",
  "naac_grade", "nirf_rank", "is_active", "agreement_start_date",
  "agreement_end_date", "sla", "mou_url", "contract_status",
  "eligible_for_hiring", "eligible_for_tier1", "is_blacklisted",
  "is_suspended", "internal_notes",
]);

/**
 * GET /api/campuses/:id -> DEEP VIEW
 */
router.get(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo", "college_admin", "college_staff"),
  async (req, res, next) => {
  try {
    const id = getParamAsString(req.params.id);
    const userRole = req.user?.role?.toLowerCase();
    const collegeId = req.user?.college_id;

    // Multi-tenancy check
    const isCentral = ["super_admin", "admin", "hr", "cxo"].includes(userRole || "");
    if (!isCentral && collegeId !== id) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const campus = await queryOne(`SELECT * FROM colleges WHERE id = $1`, [id]);
    if (!campus) {
      return res.status(404).json({ success: false, error: "Campus not found" });
    }

    // Admins
    const admins = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, 
              (SELECT MAX(created_at) FROM rbac_audit_logs WHERE actor_id = u.id AND action = 'LOGIN') as last_login
       FROM users u WHERE u.college_id = $1 AND u.role IN ('college_admin', 'college') ORDER BY u.created_at ASC`,
      [id]
    );

    // Deep Stats
    const stats = await queryOne(
      `SELECT 
        COUNT(DISTINCT sd.id)::int as student_count,
        COALESCE(AVG(ms.final_score), 0)::float as avg_score,
        COUNT(DISTINCT ec.id)::int as assessments_count,
        COUNT(DISTINCT cl.id)::int as violation_count,
        COALESCE(AVG(cl.risk_score), 0)::float as avg_risk_score
       FROM colleges c
       LEFT JOIN student_details sd ON sd.college_id = c.id
       LEFT JOIN marks_scored ms ON ms.student_id = sd.user_id
       LEFT JOIN cheating_logs cl ON cl.student_id = sd.user_id
       LEFT JOIN exam_colleges ec ON ec.college_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...campus,
        admins,
        stats: stats || {
          student_count: 0,
          avg_score: 0,
          assessments_count: 0,
          violation_count: 0,
          avg_risk_score: 0
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/campuses/:id
 * Update campus details (Central Admin/HR only)
 */
router.put(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  validate(updateCampusSchema),
  async (req, res, next) => {
    try {
      const id = getParamAsString(req.params.id);
      const updates: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      // Whitelist: only allow explicitly permitted columns to prevent mass-assignment
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined && ALLOWED_CAMPUS_UPDATE_KEYS.has(key)) {
          updates.push(`${key} = $${paramIdx++}`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: "No fields to update" });
      }

      values.push(id);
      const campus = await queryOne(
        `UPDATE colleges 
         SET ${updates.join(", ")}, updated_at = NOW()
         WHERE id = $${paramIdx}
         RETURNING *`,
        values
      );

      if (!campus) {
        return res.status(404).json({ success: false, error: "Campus not found" });
      }

      // Audit log
      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: "CAMPUS_UPDATED",
        target_type: "campus",
        target_id: id,
        reason: `Updated campus successfully`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => { });

      res.json({ success: true, data: campus });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/campuses/:id
 * Soft-delete (Toggle active status) a campus (Central Admin/HR only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  async (req, res, next) => {
    try {
      const id = getParamAsString(req.params.id);

      const result = await query(
        "UPDATE colleges SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active",
        [id]
      );

      if (result.length === 0) {
        return res.status(404).json({ success: false, error: "Campus not found" });
      }

      const isActive = result[0].is_active;

      // Audit log
      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: isActive ? "CAMPUS_ACTIVATED" : "CAMPUS_DEACTIVATED",
        target_type: "campus",
        target_id: id,
        reason: `${isActive ? "Activated" : "Deactivated"} campus status`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => { });

      res.json({
        success: true,
        message: `Campus ${isActive ? "activated" : "deactivated"} successfully`,
        data: { is_active: isActive }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campuses/:id/admins
 * Add a new admin to an existing campus (Central Admin/HR only)
 */
router.post(
  "/:id/admins",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  validate(createAdminSchema),
  async (req, res, next) => {
    try {
      const id = getParamAsString(req.params.id);
      const { name, email, password } = req.body;

      // Verify campus exists
      const campus = await queryOne("SELECT id, name FROM colleges WHERE id = $1", [id]);
      if (!campus) {
        return res.status(404).json({ success: false, error: "Campus not found" });
      }

      // Check if email already exists
      const existingUser = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
      if (existingUser) {
        return res.status(409).json({ success: false, error: "Admin email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const adminDisplayName = name.trim();

      const newAdmin = await queryOne(
        `INSERT INTO users (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password)
         VALUES ('college_admin', $1, $2, $3, $4, TRUE, TRUE, TRUE) RETURNING id, name, email, role, is_active, created_at`,
        [adminDisplayName, email, hashedPassword, id]
      );

      // Send Invitation Email
      import("../services/email.service.js").then(m => {
        m.sendCampusAdminInvitation({
          adminName: adminDisplayName,
          adminEmail: email,
          campusName: campus.name,
          temporaryPassword: password
        }).catch(err => {
          console.error("Failed to send campus admin invitation email:", err);
        });
      });

      // Audit log
      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: "CAMPUS_ADMIN_ADDED",
        target_type: "campus",
        target_id: id,
        reason: `Added admin: ${email} to campus: ${campus.name}`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => { });

      res.status(201).json({ success: true, data: newAdmin });
    } catch (err) {
      const dbErr = err as { code?: string; constraint?: string };
      if (dbErr.code === "23505" && dbErr.constraint === "users_email_key") {
        return res
          .status(409)
          .json({ success: false, error: "Admin email already in use" });
      }
      next(err);
    }
  }
);

/**
 * POST /api/campuses/bulk-action
 * Perform bulk operations (activate, suspend, delete, etc.)
 */
router.post(
  "/bulk-action",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  validate(bulkActionSchema),
  async (req, res, next) => {
    try {
      const { action, campusIds } = req.body;
      let result;

      if (action === "activate") {
        result = await query(`UPDATE colleges SET is_active = TRUE, is_suspended = FALSE WHERE id = ANY($1)`, [campusIds]);
      } else if (action === "suspend") {
        result = await query(`UPDATE colleges SET is_suspended = TRUE WHERE id = ANY($1)`, [campusIds]);
      } else if (action === "delete") {
        result = await query(`UPDATE colleges SET is_active = FALSE WHERE id = ANY($1)`, [campusIds]);
      } else if (action === "assign_exam") {
        // Assume req.body.payload has { exam_id: string }
        // Iterate over campusIds and create exam_colleges relation where it doesn't already exist
        const examId = req.body.payload?.exam_id;
        if (!examId) throw new AppError("Payload missing exam_id", 400);
        result = await query(
          `INSERT INTO exam_colleges (exam_id, college_id)
           SELECT $1::uuid, campus_id
           FROM UNNEST($2::uuid[]) AS campus_id
           ON CONFLICT DO NOTHING`,
          [examId, campusIds],
        );
      }

      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: `CAMPUS_BULK_${action.toUpperCase()}` as any,
        target_type: "bulk_campuses",
        reason: `Bulk ${action} executed on ${campusIds.length} campuses`,
      }).catch(() => { });

      res.json({ success: true, message: `Bulk ${action} completed successfully`, count: campusIds.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campuses/:id/upload-mou
 * Upload a PDF document (MOU/agreement) for a campus and store the URL.
 */
router.post(
  "/:id/upload-mou",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  mouUpload.single("mou_file"),
  async (req, res, next) => {
    try {
      const id = getParamAsString(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: "No PDF file provided" });
      }

      const campus = await queryOne("SELECT id FROM colleges WHERE id = $1", [id]);
      if (!campus) {
        return res.status(404).json({ success: false, error: "Campus not found" });
      }

      const key = `campuses/${id}/mou/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFile(key, file.buffer, file.mimetype);

      await query(
        "UPDATE colleges SET mou_url = $1, updated_at = NOW() WHERE id = $2",
        [url, id],
      );

      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: "CAMPUS_MOU_UPLOADED",
        target_type: "campus",
        target_id: id,
        reason: `MOU document uploaded: ${file.originalname}`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => {});

      res.json({ success: true, data: { mou_url: url } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
