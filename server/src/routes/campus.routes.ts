import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { query, queryOne, pool } from "../config/database.js";
import { ApiResponse } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";
import { writeAuditLog } from "../services/audit.service.js";
import bcrypt from "bcryptjs";

const router = Router();

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
});

// GET /api/campuses — requires authentication (no longer public)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const campuses = await query(`
      SELECT 
        c.*, 
        COUNT(sp.id)::int as student_count
      FROM campuses c
      LEFT JOIN student_profiles sp ON sp.campus_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.json({ success: true, data: campuses });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/campuses
 * Create a new campus (Admin/HR only)
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
      const collegeCode = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "") || "campus";

      await client.query("BEGIN");

      // 1. Create Campus
      const campusResult = await client.query(
        `INSERT INTO campuses (id, name, city, state, tier, college_code, country, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [id, name, city, state, tier || null, collegeCode, "India"]
      );
      const campus = campusResult.rows[0];

      // 2. Create Admin User
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const names = adminName.trim().split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || "";

      await client.query(
        `INSERT INTO users (role, first_name, last_name, email, password, college_id, is_active)
         VALUES ('college_admin', $1, $2, $3, $4, $5, TRUE)`,
        [firstName, lastName, adminEmail, hashedPassword, id]
      );

      await client.query("COMMIT");

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
      next(err);
    } finally {
      client.release();
    }
  }
);

router.get("/:id/stats", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await queryOne(
      `SELECT 
                COUNT(DISTINCT sp.id)::int as student_count,
                COALESCE(AVG(asess.score), 0)::float as avg_score,
                COUNT(DISTINCT pv.id)::int as violation_count
             FROM campuses c
             LEFT JOIN student_profiles sp ON sp.campus_id = c.id
             LEFT JOIN assessment_sessions asess ON asess.student_id = sp.id
             LEFT JOIN proctoring_sessions ps ON ps.student_id = sp.id
             LEFT JOIN proctoring_violations pv ON pv.session_id = ps.id
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
 * Update campus details
 */
router.put(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  validate(updateCampusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, city, state, tier } = req.body;

      const campus = await queryOne(
        `UPDATE campuses 
         SET name = $1, city = $2, state = $3, tier = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [name, city, state, tier || null, id]
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
 * Delete a campus
 */
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if students are linked
      const studentCount = await queryOne("SELECT COUNT(*) FROM users WHERE college_id = $1", [id]);
      if (parseInt(studentCount.count) > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete campus with active students. Please reassign students first."
        });
      }

      const result = await query("DELETE FROM campuses WHERE id = $1", [id]);

      // Audit log
      writeAuditLog({
        actor_id: req.user!.userId,
        actor_role: req.user!.role,
        action: "CAMPUS_DELETED",
        target_type: "campus",
        target_id: id,
        reason: `Deleted campus`,
        ip_address: typeof req.ip === "string" ? req.ip : undefined,
      }).catch(() => { });

      res.json({ success: true, message: "Campus deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
