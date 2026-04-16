// =============================================================================
// GradLogic — Placement Tracking Routes (Phase 4)
// Record placements · Stats · Funnel · College overview
// =============================================================================

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query, queryOne } from "../config/database.js";
import { sendPlacementConfirmedEmail } from "../services/email.service.js";
import { sendNotification } from "../services/notification.service.js";

const router = Router();
router.use(authenticate);

const ADMIN_ROLES = ["super_admin", "hr", "college_admin"] as const;

// =============================================================================
// PLACEMENT RECORDS — CRUD
// =============================================================================

/**
 * GET /api/placements
 * List placement records (filterable by college, drive, company, year)
 */
router.get("/", authorize(...ADMIN_ROLES, "mentor"), async (req, res, next) => {
  try {
    const {
      college_id, drive_id, company, year, limit = "50", offset = "0",
    } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (college_id) { params.push(college_id); conditions.push(`pr.college_id = $${params.length}`); }
    if (drive_id)   { params.push(drive_id);   conditions.push(`pr.drive_id = $${params.length}`); }
    if (company)    { params.push(`%${company}%`); conditions.push(`pr.company_name ILIKE $${params.length}`); }
    if (year)       { params.push(year);        conditions.push(`EXTRACT(YEAR FROM pr.placed_at) = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(parseInt(limit), parseInt(offset));

    const rows = await query(`
      SELECT
        pr.*,
        u.name  AS student_name,
        u.email AS student_email,
        sd.degree, sd.passing_year,
        c.name  AS college_name,
        ad.name AS drive_name,
        placed_by_u.name AS placed_by_name
      FROM placement_records pr
      JOIN users u ON u.id = pr.student_id
      LEFT JOIN student_details sd ON sd.user_id = pr.student_id
      LEFT JOIN colleges c ON c.id = pr.college_id
      LEFT JOIN assessment_drives ad ON ad.id = pr.drive_id
      LEFT JOIN users placed_by_u ON placed_by_u.id = pr.placed_by
      ${where}
      ORDER BY pr.placed_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countRow = await queryOne(
      `SELECT COUNT(*)::int AS total FROM placement_records pr ${where}`,
      params.slice(0, -2)
    );

    res.json({ success: true, data: rows, meta: { total: (countRow as any)?.total || 0 } });
  } catch (err) { next(err); }
});

/**
 * POST /api/placements
 * Record a new placement
 */
router.post("/", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const {
      student_id, drive_id, company_name, role_title,
      package_lpa, offer_type = "full_time", placed_at, joining_date, notes,
    } = req.body;

    if (!student_id || !company_name) {
      return res.status(400).json({ error: "student_id and company_name are required" });
    }

    // Resolve college_id from student
    const studentInfo = await queryOne(
      "SELECT u.name, u.email, COALESCE(u.college_id, sd.college_id) AS college_id FROM users u LEFT JOIN student_details sd ON sd.user_id = u.id WHERE u.id = $1",
      [student_id]
    );
    if (!studentInfo) return res.status(404).json({ error: "Student not found" });

    const placement = await queryOne(`
      INSERT INTO placement_records
        (student_id, drive_id, college_id, company_name, role_title, package_lpa,
         offer_type, placed_at, joining_date, placed_by, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (student_id, drive_id) DO UPDATE SET
        company_name  = EXCLUDED.company_name,
        role_title    = EXCLUDED.role_title,
        package_lpa   = EXCLUDED.package_lpa,
        offer_type    = EXCLUDED.offer_type,
        placed_at     = EXCLUDED.placed_at,
        joining_date  = EXCLUDED.joining_date,
        notes         = EXCLUDED.notes,
        updated_at    = NOW()
      RETURNING *
    `, [
      student_id,
      drive_id || null,
      (studentInfo as any).college_id || null,
      company_name,
      role_title || null,
      package_lpa || null,
      offer_type,
      placed_at || new Date().toISOString().slice(0, 10),
      joining_date || null,
      req.user!.userId,
      notes || null,
    ]);

    // Update student_details placement_status
    await queryOne(
      "UPDATE student_details SET placement_status = 'Placed', offer_released = TRUE WHERE user_id = $1",
      [student_id]
    );

    // Notify + email student
    const s = studentInfo as any;
    await sendNotification(student_id, "Placement Confirmed 🎓",
      `Congratulations! Your placement at ${company_name}${role_title ? ` as ${role_title}` : ""} has been confirmed.`, "success");

    sendPlacementConfirmedEmail({
      studentName: s.name, studentEmail: s.email, studentId: student_id,
      companyName: company_name, roleTitle: role_title, packageLpa: package_lpa,
      placementId: (placement as any).id,
    }).catch(() => {});

    res.status(201).json({ success: true, data: placement });
  } catch (err) { next(err); }
});

/**
 * PUT /api/placements/:id
 * Update a placement record
 */
router.put("/:id", authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { company_name, role_title, package_lpa, offer_type, placed_at, joining_date, notes } = req.body;
    const updated = await queryOne(`
      UPDATE placement_records SET
        company_name = COALESCE($1, company_name),
        role_title   = COALESCE($2, role_title),
        package_lpa  = COALESCE($3, package_lpa),
        offer_type   = COALESCE($4, offer_type),
        placed_at    = COALESCE($5, placed_at),
        joining_date = COALESCE($6, joining_date),
        notes        = COALESCE($7, notes),
        updated_at   = NOW()
      WHERE id = $8
      RETURNING *
    `, [company_name, role_title, package_lpa, offer_type, placed_at, joining_date, notes, req.params.id]);

    if (!updated) return res.status(404).json({ error: "Placement not found" });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/placements/:id
 */
router.delete("/:id", authorize("super_admin", "hr"), async (req, res, next) => {
  try {
    await queryOne("DELETE FROM placement_records WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// =============================================================================
// STATS & FUNNEL
// =============================================================================

/**
 * GET /api/placements/stats
 * Overall placement stats — total placed, avg package, top companies, yearly trend
 */
router.get("/stats", authorize(...ADMIN_ROLES, "mentor", "cxo"), async (req, res, next) => {
  try {
    const { college_id, year } = req.query as Record<string, string>;

    const filters: string[] = [];
    const params: any[] = [];

    if (college_id) { params.push(college_id); filters.push(`pr.college_id = $${params.length}`); }
    if (year)       { params.push(year);        filters.push(`EXTRACT(YEAR FROM pr.placed_at) = $${params.length}`); }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [overview, byCompany, byYear, byOfferType, topPackages] = await Promise.all([
      queryOne(`
        SELECT
          COUNT(*)::int                                    AS total_placed,
          ROUND(AVG(package_lpa) FILTER (WHERE package_lpa IS NOT NULL), 2) AS avg_package_lpa,
          MAX(package_lpa)                                AS highest_package_lpa,
          MIN(package_lpa) FILTER (WHERE package_lpa IS NOT NULL) AS lowest_package_lpa,
          COUNT(DISTINCT company_name)::int               AS unique_companies,
          COUNT(DISTINCT college_id)::int                 AS colleges_represented
        FROM placement_records pr ${where}
      `, params),

      query(`
        SELECT company_name, COUNT(*)::int AS placed_count,
               ROUND(AVG(package_lpa) FILTER (WHERE package_lpa IS NOT NULL), 2) AS avg_package
        FROM placement_records pr ${where}
        GROUP BY company_name ORDER BY placed_count DESC LIMIT 10
      `, params),

      query(`
        SELECT EXTRACT(YEAR FROM placed_at)::int AS year,
               COUNT(*)::int AS placed_count,
               ROUND(AVG(package_lpa) FILTER (WHERE package_lpa IS NOT NULL), 2) AS avg_package
        FROM placement_records pr ${where}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 5
      `, params),

      query(`
        SELECT offer_type, COUNT(*)::int AS count
        FROM placement_records pr ${where}
        GROUP BY offer_type ORDER BY count DESC
      `, params),

      query(`
        SELECT u.name AS student_name, pr.company_name, pr.role_title, pr.package_lpa
        FROM placement_records pr
        JOIN users u ON u.id = pr.student_id
        ${where}
        ORDER BY pr.package_lpa DESC NULLS LAST LIMIT 5
      `, params),
    ]);

    res.json({
      success: true,
      data: { overview, by_company: byCompany, by_year: byYear, by_offer_type: byOfferType, top_packages: topPackages },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/placements/funnel
 * Drive-to-placement conversion funnel per college or overall
 */
router.get("/funnel", authorize(...ADMIN_ROLES, "cxo"), async (req, res, next) => {
  try {
    const { college_id } = req.query as Record<string, string>;

    const funnelParams: any[] = [];
    const collegeFilter = college_id
      ? (funnelParams.push(college_id), `AND COALESCE(u.college_id, sd.college_id) = $${funnelParams.length}`)
      : "";

    const funnel = await queryOne(`
      SELECT
        COUNT(DISTINCT ds.student_id)::int                                                    AS invited,
        COUNT(DISTINCT ds.student_id) FILTER (WHERE ds.status = 'submitted')::int             AS submitted,
        COUNT(DISTINCT sd2.user_id)   FILTER (WHERE sd2.is_shortlisted = TRUE)::int           AS shortlisted,
        COUNT(DISTINCT sd2.user_id)   FILTER (WHERE sd2.interview_status IS NOT NULL)::int    AS interviewed,
        COUNT(DISTINCT sd2.user_id)   FILTER (WHERE sd2.offer_released = TRUE)::int           AS offered,
        COUNT(DISTINCT pr.student_id)::int                                                    AS placed
      FROM drive_students ds
      JOIN users u ON u.id = ds.student_id
      LEFT JOIN student_details sd ON sd.user_id = u.id
      LEFT JOIN student_details sd2 ON sd2.user_id = ds.student_id
      LEFT JOIN placement_records pr ON pr.student_id = ds.student_id
      WHERE u.role = 'student' ${collegeFilter}
    `, funnelParams);

    res.json({ success: true, data: funnel });
  } catch (err) { next(err); }
});

/**
 * GET /api/placements/college/:collegeId
 * College-specific placement summary
 */
router.get("/college/:collegeId", authorize(...ADMIN_ROLES, "mentor", "cxo"), async (req, res, next) => {
  try {
    const { collegeId } = req.params;

    const [summary, recentPlacements, companyBreakdown] = await Promise.all([
      queryOne(`
        SELECT
          COUNT(*)::int AS total_placed,
          ROUND(AVG(package_lpa) FILTER (WHERE package_lpa IS NOT NULL), 2) AS avg_package,
          MAX(package_lpa) AS highest_package,
          COUNT(DISTINCT company_name)::int AS companies
        FROM placement_records WHERE college_id = $1
      `, [collegeId]),

      query(`
        SELECT pr.company_name, pr.role_title, pr.package_lpa, pr.placed_at, u.name AS student_name
        FROM placement_records pr JOIN users u ON u.id = pr.student_id
        WHERE pr.college_id = $1 ORDER BY pr.placed_at DESC LIMIT 10
      `, [collegeId]),

      query(`
        SELECT company_name, COUNT(*)::int AS count, ROUND(AVG(package_lpa), 2) AS avg_package
        FROM placement_records WHERE college_id = $1
        GROUP BY company_name ORDER BY count DESC LIMIT 8
      `, [collegeId]),
    ]);

    res.json({ success: true, data: { summary, recent: recentPlacements, companies: companyBreakdown } });
  } catch (err) { next(err); }
});

export default router;
