import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { pool, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRole } from "../types/index.js";

export interface BulkStudentInput {
  student_id: string;
  phone_number: string;
  name?: string;
  email?: string;
}

interface StaffUserRow {
  id: string;
  role: UserRole;
  college_id: string | null;
}

interface CollegeRow {
  id: string;
  college_code: string;
}

export interface BulkCreateStudentsInput {
  staff_user_id: string;
  students: BulkStudentInput[];
}

function normalizeIdentifier(value: string): string {
  return value.trim();
}

function normalizePhone(value: string): string {
  return value.trim();
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return slug || "student";
}

function generateTemporaryPassword(): string {
  return `Tsai!${randomBytes(6).toString("base64url")}`;
}

async function resolveCollegeForStaff(staffUserId: string): Promise<CollegeRow> {
  const staff = await queryOne<StaffUserRow>(
    `SELECT id, role, college_id
     FROM users
     WHERE id = $1
       AND is_active = TRUE
       AND role IN ('college_staff', 'college_admin', 'college')`,
    [staffUserId],
  );
  if (!staff) {
    throw new AppError("Only active college staff can add students", 403);
  }

  if (staff.college_id) {
    const college = await queryOne<{ id: string; college_code: string }>(
      "SELECT id, college_code FROM colleges WHERE id = $1",
      [staff.college_id],
    );
    if (college) {
      return college;
    }
  }

  throw new AppError(
    "No college mapping found for this user. Ensure college_id is set for the staff user.",
    400,
  );
}

export async function bulkCreateStudents(input: BulkCreateStudentsInput) {
  if (input.students.length === 0) {
    throw new AppError("students array cannot be empty", 400);
  }

  const college = await resolveCollegeForStaff(input.staff_user_id);
  const client = await pool.connect();

  const created: Array<{
    user_id: string;
    student_id: string;
    email: string;
    phone_number: string;
    temporary_password: string;
  }> = [];

  const skipped: Array<{
    student_id: string;
    reason: string;
  }> = [];

  try {
    await client.query("BEGIN");

    for (const row of input.students) {
      const studentId = normalizeIdentifier(row.student_id);
      const phoneNumber = normalizePhone(row.phone_number);
      const name = row.name?.trim() || studentId;
      const nameParts = name.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? studentId;
      const lastName = nameParts.slice(1).join(" ") || null;
      const generatedEmail = `${slugify(studentId)}.${college.college_code.toLowerCase()}@students.nallastalent.ai`;
      const email = (row.email?.trim().toLowerCase() || generatedEmail).slice(
        0,
        255,
      );

      // Check if student already exists by email.
      const existingByEmail = await client.query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email],
      );
      if (existingByEmail.rows.length > 0) {
        skipped.push({
          student_id: studentId,
          reason: "email already exists",
        });
        continue;
      }
      const existingByIdentifier = await client.query<{ user_id: string }>(
        `SELECT user_id
         FROM student_details
         WHERE college_id = $1 AND student_identifier = $2
         LIMIT 1`,
        [college.id, studentId],
      );
      if (existingByIdentifier.rows.length > 0) {
        skipped.push({
          student_id: studentId,
          reason: "student_id already exists for this college",
        });
        continue;
      }

      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const createdUser = await client.query<{ id: string }>(
        `INSERT INTO users
            (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password)
         VALUES
            ('student', $1, $2, $3, $4, TRUE, FALSE, TRUE)
         RETURNING id`,
        [name, email, hashedPassword, college.id],
      );

      const userId = createdUser.rows[0]?.id;
      if (!userId) {
        throw new AppError("Failed to create student user", 500);
      }

      await client.query(
        `INSERT INTO student_details
            (user_id, college_id, first_name, last_name, student_identifier, phone_number)
         VALUES
            ($1, $2, $3, $4, $5, $6)`,
        [userId, college.id, firstName, lastName, studentId, phoneNumber],
      );

      created.push({
        user_id: userId,
        student_id: studentId,
        email,
        phone_number: phoneNumber,
        temporary_password: tempPassword,
      });
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    college_id: college.id,
    total_received: input.students.length,
    created_count: created.length,
    skipped_count: skipped.length,
    created,
    skipped,
  };
}
