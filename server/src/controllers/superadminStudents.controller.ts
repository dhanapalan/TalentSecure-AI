import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pool, query, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { ApiResponse } from "../types/index.js";
import { sendNotification } from "../services/notification.service.js";

/**
 * Ensure the academic-span + branch columns exist before we INSERT them.
 * Production DBs only run docker/init-db/*.sql on first volume boot, so a
 * freshly deployed API can reference columns that were never migrated →
 * "column ... does not exist" → 500 on bulk-import/create. This self-heals
 * idempotently (mirrors ensureStudentFormColumns in the college services).
 */
let academicColumnsReady = false;
async function ensureStudentAcademicColumns(): Promise<void> {
  if (academicColumnsReady) return;
  await query(`
    ALTER TABLE student_details
      ADD COLUMN IF NOT EXISTS branch VARCHAR(150),
      ADD COLUMN IF NOT EXISTS academic_start_year INT,
      ADD COLUMN IF NOT EXISTS academic_end_year INT
  `);
  academicColumnsReady = true;
}

const YEAR_MIN = 1900;
const YEAR_MAX = 2200;

/**
 * Parse an academic year value. Returns the integer year, null when blank/
 * unparseable (treated as "not provided"), or an error string when a value was
 * clearly provided but is out of the DB CHECK range — so the caller can skip
 * the row instead of aborting the whole transaction with a 500.
 */
function parseYearValue(raw: unknown): { value: number | null; error?: string } {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { value: null };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return { value: null };
  if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX) {
    return { value: null, error: `year must be between ${YEAR_MIN} and ${YEAR_MAX}` };
  }
  return { value: n };
}

function parseCgpaValue(raw: unknown): { value: number | null; error?: string } {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { value: null };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return { value: null };
  if (n < 0 || n > 10) return { value: null, error: "CGPA must be between 0 and 10" };
  return { value: n };
}

/** Colleges that can receive new (or reassigned) students. */
async function assertCollegeAcceptsStudents(collegeId: string): Promise<{ id: string; name: string }> {
  const college = await queryOne<{ id: string; name: string; status: string }>(
    "SELECT id, name, status FROM colleges WHERE id = $1 AND deleted_at IS NULL",
    [collegeId]
  );
  if (!college) throw new AppError("College not found", 404);
  if (college.status === "suspended") {
    throw new AppError("Cannot add students to a suspended college", 400);
  }
  if (college.status !== "active") {
    throw new AppError("Can only add students to an active college", 400);
  }
  return college;
}

/** Turn a Postgres error into a human-readable skip reason for bulk import. */
function describeImportError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "23505": // unique_violation
      return "student ID or email already exists in this college";
    case "23514": // check_violation
      return "value out of allowed range";
    case "22001": // string_data_right_truncation
      return "a field is too long";
    case "23503": // foreign_key_violation
      return "invalid college reference";
    case "23502": // not_null_violation
      return "a required field is missing";
    case "42703": // undefined_column — schema is behind the code; run migrations
      return "server database is missing a column — run pending migrations (deploy.sh migrate)";
    default:
      return err instanceof Error && err.message ? err.message : "could not import row";
  }
}

// ────────────────────────────────────────────────────────────────────
// GET /api/superadmin/students — global roster across all colleges
// ────────────────────────────────────────────────────────────────────
export const listStudents = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const {
      search,
      college_id,
      batch,
      department,
      performance,
      status,
      page = 1,
      limit = 50,
    } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const params: any[] = [];
    const where: string[] = ["u.role = 'student'", "u.deleted_at IS NULL"];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR sd.student_identifier ILIKE $${params.length})`
      );
    }
    if (college_id) {
      params.push(college_id);
      where.push(`u.college_id = $${params.length}`);
    }
    if (batch) {
      params.push(parseInt(batch as string, 10));
      where.push(
        `COALESCE(sd.academic_end_year, sd.passing_year) = $${params.length}`
      );
    }
    if (department) {
      params.push(`%${department}%`);
      where.push(
        `(COALESCE(NULLIF(sd.branch, ''), sd.specialization) ILIKE $${params.length})`
      );
    }
    if (status && status !== "all") {
      params.push(status);
      where.push(`u.status = $${params.length}`);
    }

    let havingClause = "";
    if (performance === "high") {
      havingClause = "HAVING COALESCE(AVG(ms.final_score), 0) >= 70";
    } else if (performance === "medium") {
      havingClause =
        "HAVING COALESCE(AVG(ms.final_score), 0) >= 40 AND COALESCE(AVG(ms.final_score), 0) < 70";
    } else if (performance === "low") {
      havingClause = "HAVING COALESCE(AVG(ms.final_score), 0) < 40";
    }

    const fromClause = `
      FROM users u
      LEFT JOIN student_details sd ON sd.user_id = u.id
      LEFT JOIN colleges c ON c.id = u.college_id
      LEFT JOIN marks_scored ms ON ms.student_id = u.id
      WHERE ${where.join(" AND ")}
      GROUP BY u.id, sd.id, c.id
      ${havingClause}
    `;

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM (SELECT u.id ${fromClause}) sub`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.status, u.is_active, u.created_at, u.last_login,
        c.id as college_id, c.name as college_name,
        sd.student_identifier, sd.degree,
        COALESCE(NULLIF(sd.branch, ''), sd.specialization) as department,
        COALESCE(NULLIF(sd.branch, ''), sd.specialization) as branch,
        sd.academic_start_year,
        COALESCE(sd.academic_end_year, sd.passing_year) as academic_end_year,
        COALESCE(sd.academic_end_year, sd.passing_year) as batch,
        COALESCE(ROUND(AVG(ms.final_score)::numeric, 1), 0) as readiness_score
       ${fromClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        students: result.rows,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// GET /api/superadmin/students/:id — full profile + progress
// ────────────────────────────────────────────────────────────────────
export const getStudentProfile = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const student = await queryOne<{ student_detail_id: string | null }>(
      `SELECT
        u.id, u.name, u.email, u.status, u.is_active, u.created_at, u.last_login,
        c.id as college_id, c.name as college_name,
        sd.id as student_detail_id, sd.student_identifier, sd.degree,
        COALESCE(NULLIF(sd.branch, ''), sd.specialization) as specialization,
        COALESCE(NULLIF(sd.branch, ''), sd.specialization) as branch,
        sd.academic_start_year,
        COALESCE(sd.academic_end_year, sd.passing_year) as academic_end_year,
        COALESCE(sd.academic_end_year, sd.passing_year) as passing_year,
        sd.cgpa, sd.percentage, sd.linkedin_url, sd.github_url, sd.resume_url
       FROM users u
       LEFT JOIN student_details sd ON sd.user_id = u.id
       LEFT JOIN colleges c ON c.id = u.college_id
       WHERE u.id = $1 AND u.role = 'student' AND u.deleted_at IS NULL`,
      [id]
    );

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const [examResults, certifications, moduleProgress] = await Promise.all([
      pool.query(
        `SELECT e.id, e.title, ms.final_score, ms.created_at
         FROM marks_scored ms
         JOIN exams e ON e.id = ms.exam_id
         WHERE ms.student_id = $1
         ORDER BY ms.created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT id, title, issued_at FROM certifications
         WHERE student_id = $1 AND deleted_at IS NULL
         ORDER BY issued_at DESC`,
        [id]
      ),
      student.student_detail_id
        ? pool.query(
            `SELECT smp.id, lm.title as module_title, smp.status, smp.score, smp.completed_at
             FROM student_module_progress smp
             JOIN learning_modules lm ON lm.id = smp.module_id
             WHERE smp.student_id = $1
             ORDER BY smp.completed_at DESC NULLS LAST`,
            [student.student_detail_id]
          )
        : Promise.resolve({ rows: [] as any[] }),
    ]);

    res.json({
      success: true,
      data: {
        profile: student,
        examResults: examResults.rows,
        certifications: certifications.rows,
        moduleProgress: moduleProgress.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// POST /api/superadmin/students/bulk-action
// ────────────────────────────────────────────────────────────────────
export const bulkAction = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { action, studentIds, payload } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError("studentIds is required and must be a non-empty array", 400);
    }

    if (action === "notify") {
      const title = payload?.title || "Notification from GradLogic";
      const message = payload?.message;
      if (!message) {
        throw new AppError("payload.message is required for the notify action", 400);
      }

      await Promise.all(
        studentIds.map((sid: string) => sendNotification(sid, title, message, "info"))
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user?.userId || "system",
          "BULK_NOTIFY_STUDENTS",
          "student",
          studentIds.join(","),
          req.ip,
          JSON.stringify({ count: studentIds.length, title }),
        ]
      );

      res.json({ success: true, message: `Notification sent to ${studentIds.length} student(s)` });
    } else if (action === "reset_password") {
      const tempPassword = "ChangeMe123!";
      const hashed = await bcrypt.hash(tempPassword, 12);

      const result = await pool.query(
        `UPDATE users SET password = $1, must_change_password = TRUE, updated_at = NOW()
         WHERE id = ANY($2::uuid[]) AND role = 'student' AND deleted_at IS NULL
         RETURNING id`,
        [hashed, studentIds]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user?.userId || "system",
          "BULK_RESET_PASSWORD",
          "student",
          studentIds.join(","),
          req.ip,
          JSON.stringify({ count: result.rows.length }),
        ]
      );

      res.json({
        success: true,
        message: `Password reset for ${result.rows.length} student(s)`,
      });
    } else if (action === "deactivate") {
      const result = await pool.query(
        `UPDATE users
         SET status = 'inactive', is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
         WHERE id = ANY($1::uuid[]) AND role = 'student' AND deleted_at IS NULL
         RETURNING id`,
        [studentIds]
      );

      res.json({
        success: true,
        message: `${result.rows.length} student(s) soft-deleted`,
      });
    } else if (action === "activate") {
      const result = await pool.query(
        `UPDATE users
         SET status = 'active', is_active = TRUE, deleted_at = NULL, updated_at = NOW()
         WHERE id = ANY($1::uuid[]) AND role = 'student'
         RETURNING id`,
        [studentIds]
      );

      res.json({
        success: true,
        message: `${result.rows.length} student(s) activated`,
      });
    } else {
      throw new AppError(`Unknown bulk action: ${action}`, 400);
    }
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// POST /api/superadmin/students — create student under a college
// ────────────────────────────────────────────────────────────────────
export const createStudent = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      password,
      college_id,
      student_identifier,
      phone_number,
      degree,
      specialization,
      branch,
      academic_start_year,
      academic_end_year,
      passing_year,
      cgpa,
    } = req.body;

    if (!name || !email || !college_id) {
      throw new AppError("name, email, and college_id are required", 400);
    }

    await ensureStudentAcademicColumns();
    await assertCollegeAcceptsStudents(college_id);

    const existing = await queryOne(
      "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
    );
    if (existing) throw new AppError("Email already in use", 409);

    const tempPassword = password || "ChangeMe123!";
    const hashed = await bcrypt.hash(tempPassword, 12);
    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const endParsed = parseYearValue(
      academic_end_year != null && academic_end_year !== "" ? academic_end_year : passing_year
    );
    if (endParsed.error) throw new AppError(`Academic end ${endParsed.error}`, 400);
    const startParsed = parseYearValue(academic_start_year);
    if (startParsed.error) throw new AppError(`Academic start ${startParsed.error}`, 400);
    const cgpaParsed = parseCgpaValue(cgpa);
    if (cgpaParsed.error) throw new AppError(cgpaParsed.error, 400);
    if (
      startParsed.value != null &&
      endParsed.value != null &&
      startParsed.value > endParsed.value
    ) {
      throw new AppError("Academic start year must be on or before end year", 400);
    }
    const endYear = endParsed.value;
    const startYear = startParsed.value;
    const branchValue =
      (branch != null && String(branch).trim()) ||
      (specialization != null && String(specialization).trim()) ||
      null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userRes = await client.query(
        `INSERT INTO users
           (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password, status)
         VALUES
           ('student', $1, $2, $3, $4, TRUE, FALSE, TRUE, 'active')
         RETURNING id, name, email, college_id, status, created_at`,
        [name, email, hashed, college_id]
      );
      const user = userRes.rows[0];

      await client.query(
        `INSERT INTO student_details
           (user_id, college_id, first_name, last_name, student_identifier, phone_number,
            degree, specialization, branch, academic_start_year, academic_end_year, passing_year, cgpa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          user.id,
          college_id,
          firstName,
          lastName,
          student_identifier || null,
          phone_number || null,
          degree || null,
          branchValue,
          branchValue,
          startYear,
          endYear,
          endYear,
          cgpaParsed.value,
        ]
      );

      await client.query("COMMIT");

      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user?.userId || "system", "CREATE_STUDENT", "student", user.id, req.ip]
      );

      res.status(201).json({
        success: true,
        data: { ...user, temporary_password: password ? undefined : tempPassword },
        message: "Student created successfully",
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// POST /api/superadmin/students/bulk-import
// Body: { college_id, students: [{ name, email, student_identifier?, ... }] }
// ────────────────────────────────────────────────────────────────────
export const bulkImport = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { college_id, students } = req.body as {
      college_id?: string;
      students?: Array<Record<string, unknown>>;
    };

    if (!college_id) {
      throw new AppError("college_id is required", 400);
    }
    if (!Array.isArray(students) || students.length === 0) {
      throw new AppError("students array is required", 400);
    }
    if (students.length > 500) {
      throw new AppError("Maximum 500 students per import", 400);
    }

    await ensureStudentAcademicColumns();
    const college = await assertCollegeAcceptsStudents(college_id);

    // Pre-validate + prepare rows outside the DB transaction so we don't hold
    // locks while bcrypt runs (large imports were timing out at nginx → browser
    // reported a misleading CORS error because the 502/504 had no ACAO header).
    type Prepared = {
      name: string;
      email: string;
      tempPassword: string;
      hash: string;
      student_identifier: string | null;
      phone_number: string | null;
      degree: string | null;
      branch: string | null;
      academic_start_year: number | null;
      academic_end_year: number | null;
      cgpa: number | null;
    };

    const skipped: Array<{ email: string; reason: string }> = [];
    const toCreate: Array<Omit<Prepared, "tempPassword" | "hash"> & { name: string; email: string }> = [];
    const seenEmails = new Set<string>();
    // Roll numbers already used earlier in THIS file — rejected before they hit
    // the (college_id, student_identifier) unique index.
    const seenIdentifiers = new Set<string>();

    for (const row of students) {
      const name = String(row.name || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      if (!name || !email) {
        skipped.push({ email: email || "(missing)", reason: "name and email required" });
        continue;
      }
      if (seenEmails.has(email)) {
        skipped.push({ email, reason: "duplicate email in this import file" });
        continue;
      }
      seenEmails.add(email);

      const endRaw =
        row.academic_end_year ?? row.end_year ?? row.passing_year ?? row.batch;
      const startRaw =
        row.academic_start_year ?? row.start_year ?? row.course_start_year;
      const branchRaw =
        row.branch ?? row.specialization ?? row.department;

      // Validate the numeric fields up front so one bad row can't abort the
      // whole transaction (DB CHECK violation → 500). Invalid rows are skipped
      // with a clear reason, mirroring the college bulk-import behaviour.
      const endParsed = parseYearValue(endRaw);
      const startParsed = parseYearValue(startRaw);
      const cgpaParsed = parseCgpaValue(row.cgpa);
      if (endParsed.error) {
        skipped.push({ email, reason: `academic end ${endParsed.error}` });
        continue;
      }
      if (startParsed.error) {
        skipped.push({ email, reason: `academic start ${startParsed.error}` });
        continue;
      }
      if (cgpaParsed.error) {
        skipped.push({ email, reason: cgpaParsed.error });
        continue;
      }
      if (
        startParsed.value != null &&
        endParsed.value != null &&
        startParsed.value > endParsed.value
      ) {
        skipped.push({
          email,
          reason: "academic start year must be on or before end year",
        });
        continue;
      }

      toCreate.push({
        name,
        email,
        student_identifier: String(
          row.student_identifier || row.student_id || row.roll_number || ""
        ).trim() || null,
        phone_number: row.phone_number != null ? String(row.phone_number).trim() || null : null,
        degree: row.degree != null ? String(row.degree).trim() || null : null,
        branch:
          branchRaw != null ? String(branchRaw).trim() || null : null,
        academic_start_year: startParsed.value,
        academic_end_year: endParsed.value,
        cgpa: cgpaParsed.value,
      });
    }

    // Hash temp passwords in parallel (bounded). Cost 8 is enough for one-time
    // must_change_password credentials and keeps chunks under the gateway timeout.
    const BCRYPT_ROUNDS = 8;
    const HASH_CONCURRENCY = 20;
    const prepared: Prepared[] = [];
    for (let i = 0; i < toCreate.length; i += HASH_CONCURRENCY) {
      const slice = toCreate.slice(i, i + HASH_CONCURRENCY);
      const hashedSlice = await Promise.all(
        slice.map(async (row) => {
          const tempPassword = `Campus${Math.random().toString(36).slice(2, 8)}!`;
          const hash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
          return { ...row, tempPassword, hash };
        })
      );
      prepared.push(...hashedSlice);
    }

    // Single existence check instead of N round-trips inside the transaction.
    const existingRes = await pool.query<{ email: string }>(
      `SELECT email FROM users WHERE email = ANY($1::text[]) AND deleted_at IS NULL`,
      [prepared.map((r) => r.email)]
    );
    const existingEmails = new Set(existingRes.rows.map((r) => r.email.toLowerCase()));

    const created: Array<{ user_id: string; email: string; temporary_password: string }> = [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const row of prepared) {
        if (existingEmails.has(row.email)) {
          skipped.push({ email: row.email, reason: "email already exists" });
          continue;
        }
        // Reject roll numbers duplicated within this file before they collide at the DB.
        if (row.student_identifier) {
          const idKey = row.student_identifier.toLowerCase();
          if (seenIdentifiers.has(idKey)) {
            skipped.push({
              email: row.email,
              reason: `duplicate student ID "${row.student_identifier}" in uploaded file`,
            });
            continue;
          }
        }

        // Isolate each row so one bad record — a unique-constraint clash, an
        // over-length value, or a column that is missing in this environment —
        // is skipped instead of aborting the whole transaction with a 500.
        await client.query("SAVEPOINT bulk_row");
        try {
          const parts = row.name.split(/\s+/);
          const userRes = await client.query(
            `INSERT INTO users
               (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password, status)
             VALUES ('student', $1, $2, $3, $4, TRUE, FALSE, TRUE, 'active')
             RETURNING id`,
            [row.name, row.email, row.hash, college_id]
          );
          const userId = userRes.rows[0].id;
          await client.query(
            `INSERT INTO student_details
               (user_id, college_id, first_name, last_name, student_identifier, phone_number,
                degree, specialization, branch, academic_start_year, academic_end_year, passing_year, cgpa)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              userId,
              college_id,
              parts[0] || row.name,
              parts.slice(1).join(" ") || "",
              row.student_identifier,
              row.phone_number,
              row.degree,
              row.branch,
              row.branch,
              Number.isFinite(row.academic_start_year as number) ? row.academic_start_year : null,
              Number.isFinite(row.academic_end_year as number) ? row.academic_end_year : null,
              Number.isFinite(row.academic_end_year as number) ? row.academic_end_year : null,
              Number.isFinite(row.cgpa as number) ? row.cgpa : null,
            ]
          );
          await client.query("RELEASE SAVEPOINT bulk_row");
          existingEmails.add(row.email);
          if (row.student_identifier) seenIdentifiers.add(row.student_identifier.toLowerCase());
          created.push({
            user_id: userId,
            email: row.email,
            temporary_password: row.tempPassword,
          });
        } catch (rowErr) {
          await client.query("ROLLBACK TO SAVEPOINT bulk_row");
          skipped.push({ email: row.email, reason: describeImportError(rowErr) });
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user?.userId || "system",
        "BULK_IMPORT_STUDENTS",
        "college",
        college_id,
        req.ip,
      ]
    ).catch(() => undefined);

    // Omit per-row temp passwords on larger batches — UI only shows counts, and
    // shipping hundreds of secrets inflates response time for no benefit.
    const createdPayload =
      created.length > 25
        ? created.map(({ user_id, email }) => ({
            user_id,
            email,
            temporary_password: "",
          }))
        : created;

    res.status(201).json({
      success: true,
      data: {
        college_id,
        college_name: college.name,
        created_count: created.length,
        skipped_count: skipped.length,
        created: createdPayload,
        skipped,
      },
      message: `Imported ${created.length} student(s) into ${college.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// PUT /api/superadmin/students/:id — update student profile
// ────────────────────────────────────────────────────────────────────
export const updateStudent = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      college_id,
      status,
      is_active,
      student_identifier,
      phone_number,
      degree,
      specialization,
      branch,
      academic_start_year,
      academic_end_year,
      passing_year,
      cgpa,
    } = req.body;

    const student = await queryOne(
      `SELECT id FROM users WHERE id = $1 AND role = 'student' AND deleted_at IS NULL`,
      [id]
    );
    if (!student) throw new AppError("Student not found", 404);

    await ensureStudentAcademicColumns();

    if (college_id !== undefined) {
      await assertCollegeAcceptsStudents(college_id);
    }

    const endYear =
      academic_end_year !== undefined
        ? academic_end_year
        : passing_year !== undefined
          ? passing_year
          : undefined;
    const branchValue =
      branch !== undefined
        ? branch
        : specialization !== undefined
          ? specialization
          : undefined;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userFields: string[] = [];
      const userParams: unknown[] = [];
      let idx = 1;
      const setUser = (col: string, val: unknown) => {
        userFields.push(`${col} = $${idx++}`);
        userParams.push(val);
      };
      if (name !== undefined) setUser("name", name);
      if (email !== undefined) setUser("email", email);
      if (college_id !== undefined) setUser("college_id", college_id);
      if (status !== undefined) setUser("status", status);
      if (is_active !== undefined) setUser("is_active", is_active);
      if (userFields.length > 0) {
        userFields.push("updated_at = NOW()");
        userParams.push(id);
        await client.query(
          `UPDATE users SET ${userFields.join(", ")} WHERE id = $${idx}`,
          userParams
        );
      }

      const detailFields: string[] = [];
      const detailParams: unknown[] = [];
      let dIdx = 1;
      const setDetail = (col: string, val: unknown) => {
        detailFields.push(`${col} = $${dIdx++}`);
        detailParams.push(val);
      };
      if (student_identifier !== undefined) setDetail("student_identifier", student_identifier);
      if (phone_number !== undefined) setDetail("phone_number", phone_number);
      if (degree !== undefined) setDetail("degree", degree);
      if (branchValue !== undefined) {
        setDetail("branch", branchValue);
        setDetail("specialization", branchValue);
      }
      if (academic_start_year !== undefined) setDetail("academic_start_year", academic_start_year);
      if (endYear !== undefined) {
        setDetail("academic_end_year", endYear);
        setDetail("passing_year", endYear);
      }
      if (cgpa !== undefined) setDetail("cgpa", cgpa);
      if (college_id !== undefined) setDetail("college_id", college_id);
      if (detailFields.length > 0) {
        detailParams.push(id);
        await client.query(
          `UPDATE student_details SET ${detailFields.join(", ")} WHERE user_id = $${dIdx}`,
          detailParams
        );
      }

      await client.query("COMMIT");
      res.json({ success: true, message: "Student updated successfully" });
    } catch (e: unknown) {
      await client.query("ROLLBACK");
      const pg = e as { code?: string; constraint?: string; detail?: string };
      if (pg.code === "23514") {
        const fieldErrors: Record<string, string> = {};
        if (pg.constraint?.includes("academic_start")) {
          fieldErrors.academic_start_year = "Enter a valid academic start year";
        } else if (
          pg.constraint?.includes("academic_end") ||
          pg.constraint?.includes("passing_year")
        ) {
          fieldErrors.academic_end_year = "Enter a valid academic end year";
        } else if (pg.constraint?.includes("academic_span")) {
          fieldErrors.academic_start_year =
            "Academic start year must be on or before end year";
        } else if (pg.constraint?.includes("cgpa")) {
          fieldErrors.cgpa = "CGPA must be between 0 and 10";
        }
        throw new AppError(
          Object.values(fieldErrors)[0] || "Invalid student field value",
          400,
          true
        );
      }
      if (pg.code === "23505") {
        throw new AppError("Email already in use", 409);
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 400) {
      const msg = error.message;
      const fieldErrors: Record<string, string> = {};
      if (/academic start/i.test(msg)) fieldErrors.academic_start_year = msg;
      if (/academic end|passing year/i.test(msg)) fieldErrors.academic_end_year = msg;
      if (/cgpa/i.test(msg)) fieldErrors.cgpa = msg;
      if (Object.keys(fieldErrors).length) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: msg,
          fieldErrors,
        });
      }
    }
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// DELETE /api/superadmin/students/:id — soft delete
// ────────────────────────────────────────────────────────────────────
export const softDeleteStudent = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users
       SET status = 'inactive', is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND role = 'student' AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) throw new AppError("Student not found", 404);

    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user?.userId || "system", "SOFT_DELETE_STUDENT", "student", id, req.ip]
    );

    res.json({ success: true, message: "Student soft-deleted successfully" });
  } catch (error) {
    next(error);
  }
};
