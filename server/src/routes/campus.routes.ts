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
  adminName: z.string().min(1, "Admin full name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateCampusSchema = createCampusSchema.omit({
  adminName: true,
  adminEmail: true,
  adminPassword: true,
}).extend({
  is_active: z.boolean().optional(),
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
          COUNT(sd.id)::int as student_count
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
        `INSERT INTO colleges (id, name, city, state, tier, college_code, country, created_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), TRUE)
         RETURNING *`,
        [id, name, city, state, tier || null, collegeCode, "India"]
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

/**
 * GET /api/campuses/:id/stats
 * Restrict to Central Admins or the owner of that college
 */
router.get("/:id/stats", authenticate, async (req, res, next) => {
  try {
    const id = getParamAsString(req.params.id);
    const userRole = req.user?.role?.toLowerCase();
    const collegeId = req.user?.college_id;

    // Strict multi-tenancy check
    const isCentral = ["super_admin", "admin", "hr", "cxo"].includes(userRole || "");
    if (!isCentral && collegeId !== id) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const stats = await queryOne(
      `SELECT 
                COUNT(DISTINCT sd.id)::int as student_count,
                COALESCE(AVG(ea.score), 0)::float as avg_score,
                COUNT(DISTINCT cl.id)::int as violation_count
             FROM colleges c
             LEFT JOIN student_details sd ON sd.college_id = c.id
             LEFT JOIN exam_attempts ea ON ea.student_id = sd.user_id
             LEFT JOIN cheating_logs cl ON cl.student_id = sd.user_id
             WHERE c.id = $1
             GROUP BY c.id`,
      [id]
    );
    res.json({ success: true, data: stats || { student_count: 0, avg_score: 0, violation_count: 0 } });
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
      const { name, city, state, tier, is_active } = req.body;

      // Build dynamic update to handle optional fields including is_active
      const updates: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (name !== undefined) { updates.push(`name = $${paramIdx++}`); values.push(name); }
      if (city !== undefined) { updates.push(`city = $${paramIdx++}`); values.push(city); }
      if (state !== undefined) { updates.push(`state = $${paramIdx++}`); values.push(state); }
      if (tier !== undefined) { updates.push(`tier = $${paramIdx++}`); values.push(tier || null); }
      if (is_active !== undefined) { updates.push(`is_active = $${paramIdx++}`); values.push(is_active); }

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
        reason: `Updated campus: ${name}`,
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

export default router;
