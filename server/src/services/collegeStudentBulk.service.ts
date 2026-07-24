/**
 * Sprint 2.3 — Student Bulk Upload (Excel validate + import).
 */
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { pool, query, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { writeAuditLog } from "./audit.service.js";
import { ensureStudentFormColumns } from "./collegeStudentForm.service.js";

export const BULK_HEADERS = [
  "roll_number",
  "register_number",
  "name",
  "gender",
  "dob",
  "email",
  "phone_number",
  "branch",
  "program",
  "academic_start_year",
  "academic_end_year",
  "semester",
  "section",
  "cgpa",
  "placement_eligible",
  "placement_status",
] as const;

const HEADER_ALIASES: Record<string, string> = {
  roll_number: "roll_number",
  roll: "roll_number",
  rollno: "roll_number",
  roll_no: "roll_number",
  student_identifier: "roll_number",
  register_number: "register_number",
  register: "register_number",
  register_no: "register_number",
  name: "name",
  student_name: "name",
  gender: "gender",
  dob: "dob",
  date_of_birth: "dob",
  email: "email",
  phone_number: "phone_number",
  phone: "phone_number",
  mobile: "phone_number",
  branch: "branch",
  department: "branch",
  dept: "branch",
  specialization: "branch",
  program: "program",
  degree: "program",
  academic_start_year: "academic_start_year",
  start_year: "academic_start_year",
  course_start_year: "academic_start_year",
  academic_end_year: "academic_end_year",
  end_year: "academic_end_year",
  academic_year: "academic_end_year",
  passing_year: "academic_end_year",
  batch: "academic_end_year",
  semester: "semester",
  section: "section",
  cgpa: "cgpa",
  placement_eligible: "placement_eligible",
  placement_status: "placement_status",
};

export type BulkRowStatus = "ok" | "error" | "skip";

export interface BulkRowData {
  roll_number: string;
  register_number: string;
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone_number: string;
  branch: string;
  program: string;
  academic_start_year: string;
  academic_end_year: string;
  semester: string;
  section: string;
  cgpa: string;
  placement_eligible: string;
  placement_status: string;
}

export interface ValidatedBulkRow {
  row_number: number;
  status: BulkRowStatus;
  errors: string[];
  data: BulkRowData;
}

function normHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_");
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v: string): boolean {
  return /^\d{7,15}$/.test(v.replace(/[\s\-()+]/g, ""));
}

function parseEligible(v: string): boolean {
  const s = v.trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(s);
}

export function buildSampleTemplateBuffer(): Buffer {
  const sample = [
    {
      roll_number: "CS2026001",
      register_number: "REG2026001",
      name: "Ada Lovelace",
      gender: "female",
      dob: "2004-05-10",
      email: "ada.lovelace@college.edu",
      phone_number: "9876543210",
      branch: "Computer Science",
      program: "B.E",
      academic_start_year: "2022",
      academic_end_year: "2026",
      semester: "6",
      section: "A",
      cgpa: "8.5",
      placement_eligible: "yes",
      placement_status: "Not Shortlisted",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample, { header: [...BULK_HEADERS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseExcelBuffer(buffer: Buffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new AppError("Excel file has no sheets.", 400);
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  if (!raw.length) throw new AppError("Excel file has no data rows.", 400);

  return raw.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = HEADER_ALIASES[normHeader(k)];
      if (!key) continue;
      let val = v == null ? "" : String(v).trim();
      if (key === "dob" && v instanceof Date) {
        val = v.toISOString().slice(0, 10);
      }
      mapped[key] = val;
    }
    return mapped;
  });
}

async function loadCollegeCatalog(collegeId: string) {
  const branches = await query<{ v: string }>(
    `SELECT DISTINCT TRIM(COALESCE(NULLIF(branch, ''), specialization)) AS v
     FROM student_details
     WHERE college_id = $1
       AND COALESCE(NULLIF(branch, ''), specialization) IS NOT NULL
       AND TRIM(COALESCE(NULLIF(branch, ''), specialization)) <> ''
     LIMIT 200`,
    [collegeId]
  ).catch(() => []);
  const endYears = await query<{ v: string }>(
    `SELECT DISTINCT TRIM(COALESCE(academic_end_year, passing_year)::text) AS v
     FROM student_details
     WHERE college_id = $1
       AND COALESCE(academic_end_year, passing_year) IS NOT NULL
     LIMIT 200`,
    [collegeId]
  ).catch(() => []);
  return {
    branches: new Set(branches.map((d) => d.v.toLowerCase())),
    endYears: new Set(endYears.map((b) => b.v.toLowerCase())),
  };
}

async function loadExistingRollsAndEmails(collegeId: string) {
  const rows = await query<{ roll: string | null; email: string }>(
    `SELECT LOWER(TRIM(sd.student_identifier)) AS roll, LOWER(TRIM(u.email)) AS email
     FROM student_details sd
     JOIN users u ON u.id = sd.user_id
     WHERE COALESCE(u.college_id, sd.college_id) = $1
       AND u.deleted_at IS NULL
       AND LOWER(u.role::text) = 'student'`,
    [collegeId]
  ).catch(() => []);
  const rolls = new Set<string>();
  const emails = new Set<string>();
  for (const r of rows) {
    if (r.roll) rolls.add(r.roll);
    if (r.email) emails.add(r.email);
  }
  return { rolls, emails };
}

function toRowData(raw: Record<string, string>): BulkRowData {
  return {
    roll_number: raw.roll_number || "",
    register_number: raw.register_number || "",
    name: raw.name || "",
    gender: raw.gender || "",
    dob: raw.dob || "",
    email: (raw.email || "").toLowerCase(),
    phone_number: raw.phone_number || "",
    branch: raw.branch || "",
    program: raw.program || "",
    academic_start_year: raw.academic_start_year || "",
    academic_end_year: raw.academic_end_year || "",
    semester: raw.semester || "",
    section: raw.section || "",
    cgpa: raw.cgpa || "",
    placement_eligible: raw.placement_eligible || "",
    placement_status: raw.placement_status || "Not Shortlisted",
  };
}

export async function validateBulkRows(
  collegeId: string,
  rawRows: Record<string, string>[]
): Promise<{
  rows: ValidatedBulkRow[];
  summary: { total: number; ok: number; error: number; skip: number };
}> {
  if (rawRows.length > 500) {
    throw new AppError("Maximum 500 students per upload.", 400);
  }

  const catalog = await loadCollegeCatalog(collegeId);
  const existing = await loadExistingRollsAndEmails(collegeId);
  const fileRolls = new Set<string>();
  const fileEmails = new Set<string>();

  const rows: ValidatedBulkRow[] = rawRows.map((raw, idx) => {
    const data = toRowData(raw);
    const errors: string[] = [];
    const row_number = idx + 2; // header is row 1

    if (!data.roll_number) errors.push("Missing mandatory field: Roll Number");
    if (!data.name) errors.push("Missing mandatory field: Student Name");
    if (!data.branch) errors.push("Missing mandatory field: Branch");
    if (!data.academic_end_year) errors.push("Missing mandatory field: Academic end year");
    if (!data.email) errors.push("Missing mandatory field: Email");

    if (data.email && !isValidEmail(data.email)) errors.push("Invalid Email");
    if (data.phone_number && !isValidPhone(data.phone_number)) errors.push("Invalid Phone");

    if (
      catalog.branches.size > 0 &&
      data.branch &&
      !catalog.branches.has(data.branch.toLowerCase())
    ) {
      errors.push("Invalid Branch");
    }

    if (data.academic_start_year) {
      const start = Number(data.academic_start_year);
      if (!Number.isInteger(start) || start < 1900 || start > 2200) {
        errors.push("Invalid academic start year");
      }
    }
    if (data.academic_end_year) {
      const end = Number(data.academic_end_year);
      if (!Number.isInteger(end) || end < 1900 || end > 2200) {
        errors.push("Invalid academic end year");
      }
    }
    if (data.academic_start_year && data.academic_end_year) {
      const start = Number(data.academic_start_year);
      const end = Number(data.academic_end_year);
      if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
        errors.push("Academic start year must be on or before end year");
      }
    }

    if (data.cgpa) {
      const n = Number(data.cgpa);
      if (Number.isNaN(n) || n < 0 || n > 10) errors.push("Invalid CGPA (must be 0–10)");
    }

    const rollKey = data.roll_number.toLowerCase();
    const emailKey = data.email.toLowerCase();

    if (rollKey && fileRolls.has(rollKey)) {
      errors.push("Duplicate Roll Number (in file)");
    }
    if (rollKey && existing.rolls.has(rollKey)) {
      errors.push("Duplicate Roll Number");
    }
    if (emailKey && fileEmails.has(emailKey)) {
      errors.push("Duplicate Email (in file)");
    }
    if (emailKey && existing.emails.has(emailKey)) {
      // Skip existing emails rather than hard-fail as "error" for import summary
      // Spec: Failed vs Skipped — treat existing email as skip
    }

    if (rollKey) fileRolls.add(rollKey);
    if (emailKey) fileEmails.add(emailKey);

    let status: BulkRowStatus = "ok";
    if (errors.length) status = "error";
    else if (emailKey && existing.emails.has(emailKey)) {
      status = "skip";
      errors.push("Email already exists — will be skipped");
    }

    return { row_number, status, errors, data };
  });

  const summary = {
    total: rows.length,
    ok: rows.filter((r) => r.status === "ok").length,
    error: rows.filter((r) => r.status === "error").length,
    skip: rows.filter((r) => r.status === "skip").length,
  };

  return { rows, summary };
}

export async function importValidatedRows(
  collegeId: string,
  rows: ValidatedBulkRow[],
  actor: { id: string; role: string; ip?: string }
) {
  await ensureStudentFormColumns();

  const college = await queryOne<{ id: string; status: string }>(
    "SELECT id, status FROM colleges WHERE id = $1 AND deleted_at IS NULL",
    [collegeId]
  );
  if (!college) throw new AppError("College not found", 404);
  if (college.status !== "active") {
    throw new AppError("Can only import students to an active college", 400);
  }

  const toImport = rows.filter((r) => r.status === "ok");
  const skipped = rows.filter((r) => r.status === "skip");
  const failedPre = rows.filter((r) => r.status === "error");

  const successful: Array<{ row_number: number; user_id: string; email: string }> = [];
  const failed: Array<{ row_number: number; email: string; roll_number: string; errors: string[] }> =
    failedPre.map((r) => ({
      row_number: r.row_number,
      email: r.data.email,
      roll_number: r.data.roll_number,
      errors: r.errors,
    }));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of toImport) {
      const d = row.data;
      try {
        const existing = await client.query(
          `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`,
          [d.email]
        );
        if (existing.rows.length) {
          failed.push({
            row_number: row.row_number,
            email: d.email,
            roll_number: d.roll_number,
            errors: ["Email already exists"],
          });
          continue;
        }
        const rollClash = await client.query(
          `SELECT user_id FROM student_details
           WHERE college_id = $1 AND LOWER(TRIM(student_identifier)) = LOWER(TRIM($2))
           LIMIT 1`,
          [collegeId, d.roll_number]
        );
        if (rollClash.rows.length) {
          failed.push({
            row_number: row.row_number,
            email: d.email,
            roll_number: d.roll_number,
            errors: ["Duplicate Roll Number"],
          });
          continue;
        }

        const tempPassword = `Campus${Math.random().toString(36).slice(2, 8)}!`;
        const hashed = await bcrypt.hash(tempPassword, 12);
        const parts = d.name.split(/\s+/);
        const startYear = d.academic_start_year ? parseInt(d.academic_start_year, 10) : null;
        const endYear = d.academic_end_year ? parseInt(d.academic_end_year, 10) : null;
        const cgpa = d.cgpa ? Number(d.cgpa) : null;
        const gender = d.gender || null;
        const dob = d.dob || null;

        const userRes = await client.query(
          `INSERT INTO users
             (role, name, email, password, college_id, phone_number, dob, is_active, is_profile_complete, must_change_password, status)
           VALUES ('student', $1, $2, $3, $4, $5, $6::date, TRUE, FALSE, TRUE, 'active')
           RETURNING id`,
          [d.name, d.email, hashed, collegeId, d.phone_number || null, dob]
        );
        const userId = userRes.rows[0].id;
        await client.query(
          `INSERT INTO student_details
             (user_id, college_id, first_name, last_name, student_identifier, register_number,
              phone_number, gender, dob, degree, specialization, branch, class_name, semester, section,
              academic_start_year, academic_end_year, passing_year, cgpa, eligible_for_hiring, placement_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [
            userId,
            collegeId,
            parts[0] || d.name,
            parts.slice(1).join(" ") || "",
            d.roll_number,
            d.register_number || null,
            d.phone_number || null,
            gender,
            dob,
            d.program || null,
            d.branch,
            d.branch,
            Number.isFinite(endYear as number) ? String(endYear) : null,
            d.semester || null,
            d.section || null,
            Number.isFinite(startYear as number) ? startYear : null,
            Number.isFinite(endYear as number) ? endYear : null,
            Number.isFinite(endYear as number) ? endYear : null,
            Number.isFinite(cgpa as number) ? cgpa : null,
            parseEligible(d.placement_eligible),
            d.placement_status || "Not Shortlisted",
          ]
        );
        successful.push({ row_number: row.row_number, user_id: userId, email: d.email });
      } catch (e: any) {
        failed.push({
          row_number: row.row_number,
          email: d.email,
          roll_number: d.roll_number,
          errors: [e?.message || "Import failed"],
        });
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  await writeAuditLog({
    actor_id: actor.id,
    actor_role: actor.role,
    action: "STUDENTS_BULK_ADDED",
    target_type: "campus",
    target_id: collegeId,
    reason: `Bulk imported ${successful.length} students`,
    metadata: {
      total: rows.length,
      successful: successful.length,
      failed: failed.length,
      skipped: skipped.length,
    },
    ip_address: actor.ip,
  }).catch(() => {});

  return {
    summary: {
      total: rows.length,
      successful: successful.length,
      failed: failed.length,
      skipped: skipped.length,
    },
    successful,
    failed,
    skipped: skipped.map((r) => ({
      row_number: r.row_number,
      email: r.data.email,
      roll_number: r.data.roll_number,
      errors: r.errors,
    })),
  };
}

export function buildErrorReportBuffer(
  failed: Array<{ row_number: number; email: string; roll_number: string; errors: string[] }>
): Buffer {
  const rows = failed.map((f) => ({
    row_number: f.row_number,
    roll_number: f.roll_number,
    email: f.email,
    errors: f.errors.join("; "),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
