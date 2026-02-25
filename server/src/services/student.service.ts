import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool, query, queryOne } from "../config/database.js";
import { uploadFile } from "../config/storage.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRow, ExamRow } from "../types/index.js";

interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  college_id: string;
  webcamPhoto?: Express.Multer.File;
}

interface BulkStudentInput {
  name: string;
  email: string;
  password?: string; // Optional, will default to a hashed version of email if missing or just a fixed default
}

type StudentGender = "male" | "female" | "non_binary" | "prefer_not_to_say";

interface UpdateStudentInput {
  // Existing compatibility fields
  name?: string;
  email?: string;
  college_id?: string;
  phone_number?: string;
  dob?: string | Date | null;
  degree?: string;
  class_name?: string;
  class?: string;
  section?: string;
  major?: string;
  graduation_year?: number;

  // Extended onboarding fields
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: StudentGender;
  alternate_email?: string;
  alternate_phone?: string;
  specialization?: string;
  passing_year?: number;
  cgpa?: number;
  percentage?: number;
  roll_number?: string;
  student_identifier?: string;
  skills?: string[] | string;
  linkedin_url?: string;
  github_url?: string;

  profilePhoto?: Express.Multer.File;
  resumeFile?: Express.Multer.File;
}

interface UpdatableUserRow {
  id: string;
  role: string;
  college_id: string | null;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSkillsInput(value: string[] | string | undefined): string[] | null {
  if (Array.isArray(value)) {
    const skills = value
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return skills.length > 0 ? Array.from(new Set(skills)) : null;
  }

  if (typeof value === "string") {
    const skills = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return skills.length > 0 ? Array.from(new Set(skills)) : null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Student Registration
// ─────────────────────────────────────────────────────────────────────────────

export async function registerStudent(input: RegisterStudentInput) {
  const existing = await queryOne<UserRow>(
    "SELECT id FROM users WHERE email = $1",
    [input.email.toLowerCase()],
  );
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const college = await queryOne<{ id: string }>(
    "SELECT id FROM colleges WHERE id = $1",
    [input.college_id],
  );
  if (!college) {
    throw new AppError("Invalid college selection", 400);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  let facePhotoUrl: string | null = null;
  if (input.webcamPhoto) {
    const ext = input.webcamPhoto.originalname.split(".").pop() || "jpg";
    const key = `faces/${uuidv4()}.${ext}`;
    facePhotoUrl = await uploadFile(
      key,
      input.webcamPhoto.buffer,
      input.webcamPhoto.mimetype,
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query<{
      id: string;
      role: string;
      name: string;
      email: string;
      college_id: string | null;
      is_profile_complete: boolean;
      created_at: Date;
    }>(
      `INSERT INTO users
         (role, name, email, password, college_id, is_active, is_profile_complete)
       VALUES
         ('student', $1, $2, $3, $4, TRUE, FALSE)
       RETURNING id, role, name, email, college_id, is_profile_complete, created_at`,
      [input.name.trim(), input.email.toLowerCase().trim(), hashedPassword, college.id],
    );
    const user = userResult.rows[0];

    const profileResult = await client.query<{ id: string }>(
      `INSERT INTO student_details (user_id, college_id, face_photo_url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, college.id, facePhotoUrl],
    );

    await client.query("COMMIT");

    return { user, profile_id: profileResult.rows[0].id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Bulk Student Registration
 */
export async function bulkRegisterStudents(collegeId: string, students: BulkStudentInput[]) {
  const college = await queryOne<{ id: string }>(
    "SELECT id FROM colleges WHERE id = $1",
    [collegeId],
  );
  if (!college) {
    throw new AppError("Invalid college selection", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const results = [];

    for (const student of students) {
      const email = student.email.toLowerCase().trim();
      const name = student.name.trim();

      // Default password if not provided (e.g. from CSV)
      const rawPassword = student.password || "Welcome@123";
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      // Check if user exists
      const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        // Skip or update? For bulk import, let's skip for now or mark as error in result
        continue;
      }

      // Insert User
      const userResult = await client.query<{ id: string }>(
        `INSERT INTO users
           (role, name, email, password, college_id, is_active, is_profile_complete)
         VALUES
           ('student', $1, $2, $3, $4, TRUE, FALSE)
         RETURNING id`,
        [name, email, hashedPassword, collegeId],
      );
      const userId = userResult.rows[0].id;

      // Insert Student Detail
      await client.query(
        `INSERT INTO student_details (user_id, college_id)
         VALUES ($1, $2)`,
        [userId, collegeId],
      );

      results.push(userId);
    }

    await client.query("COMMIT");
    return { count: results.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Exam Schedule for a Student
// ─────────────────────────────────────────────────────────────────────────────

export async function getExamScheduleForStudent(studentUserId: string) {
  const student = await queryOne<{ college_id: string }>(
    "SELECT college_id FROM users WHERE id = $1 AND LOWER(role::text) = 'student'",
    [studentUserId],
  );
  if (!student || !student.college_id) {
    throw new AppError("Student not found", 404);
  }

  const exams = await query<
    ExamRow & {
      scheduled_at: Date;
      role_title: string | null;
      role_company: string | null;
      score: number | null;
    }
  >(
    `SELECT
        e.*,
        e.scheduled_time AS scheduled_at,
        NULL::text AS role_title,
        NULL::text AS role_company,
        ms.final_score AS score
     FROM exams e
     JOIN exam_colleges ec ON ec.exam_id = e.id
     LEFT JOIN marks_scored ms ON ms.exam_id = e.id AND ms.student_id = $1
     WHERE ec.college_id = $2
       AND e.is_active = TRUE
     ORDER BY e.scheduled_time ASC`,
    [studentUserId, student.college_id],
  );

  return exams;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Student profile list + update
// ─────────────────────────────────────────────────────────────────────────────

export async function listStudents(limit = 50, offset = 0, collegeId?: string) {
  let sql = `
    SELECT
        u.id,
        u.email,
        u.name,
        COALESCE(NULLIF(sd.first_name, ''), SPLIT_PART(COALESCE(u.name, ''), ' ', 1), '') AS first_name,
        NULLIF(sd.middle_name, '') AS middle_name,
        COALESCE(
          NULLIF(sd.last_name, ''),
          NULLIF(TRIM(REGEXP_REPLACE(COALESCE(u.name, ''), '^\\S+\\s*', '')), ''),
          ''
        ) AS last_name,
        COALESCE(u.college_id, sd.college_id) AS college_id,
        u.created_at,
        u.is_profile_complete,
        u.phone_number AS user_phone_number,
        sd.phone_number,
        sd.alternate_email,
        sd.alternate_phone,
        sd.dob,
        sd.gender,
        sd.degree,
        sd.specialization,
        sd.specialization AS major,
        sd.class_name,
        sd.section,
        sd.passing_year AS passing_year,
        sd.passing_year AS graduation_year,
        sd.cgpa,
        sd.percentage,
        sd.student_identifier AS roll_number,
        sd.student_identifier,
        sd.resume_url,
        sd.skills,
        sd.linkedin_url,
        sd.github_url,
        sd.face_photo_url AS photo_url,
        c.name AS college_name
     FROM users u
     LEFT JOIN student_details sd ON sd.user_id = u.id
     LEFT JOIN colleges c ON c.id = COALESCE(u.college_id, sd.college_id)
     WHERE LOWER(u.role::text) = 'student'
  `;

  const params: any[] = [limit, offset];
  if (collegeId) {
    sql += ` AND COALESCE(u.college_id, sd.college_id) = $3 `;
    params.push(collegeId);
  }

  sql += ` ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`;

  return query(sql, params);
}

export async function updateStudent(studentId: string, input: UpdateStudentInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query<UpdatableUserRow>(
      "SELECT id, role, college_id FROM users WHERE id = $1",
      [studentId],
    );
    if (existingUser.rows.length === 0) {
      throw new AppError("Student not found", 404);
    }
    const currentUser = existingUser.rows[0];

    const firstName = normalizeOptionalString(input.first_name);
    const middleName = normalizeOptionalString(input.middle_name);
    const lastName = normalizeOptionalString(input.last_name);
    const fullNameFromParts = [firstName, middleName, lastName].filter(Boolean).join(" ");
    const normalizedName =
      normalizeOptionalString(input.name) ??
      (fullNameFromParts.trim().length > 0 ? fullNameFromParts.trim() : null);

    const normalizedEmail = normalizeOptionalString(input.email)?.toLowerCase() ?? null;
    const primaryPhone = normalizeOptionalString(input.phone_number);
    const alternateEmail = normalizeOptionalString(input.alternate_email)?.toLowerCase() ?? null;
    const alternatePhone = normalizeOptionalString(input.alternate_phone);
    const degree = normalizeOptionalString(input.degree);
    const specialization = normalizeOptionalString(input.specialization ?? input.major);
    const className = normalizeOptionalString(input.class_name ?? input.class);
    const section = normalizeOptionalString(input.section);
    const rollNumber = normalizeOptionalString(input.roll_number ?? input.student_identifier);
    const gender = normalizeOptionalString(input.gender);
    const linkedinUrl = normalizeOptionalString(input.linkedin_url);
    const githubUrl = normalizeOptionalString(input.github_url);
    const skills = normalizeSkillsInput(input.skills);
    const passingYear = input.passing_year ?? input.graduation_year ?? null;
    const cgpa = typeof input.cgpa === "number" ? input.cgpa : null;
    const percentage = typeof input.percentage === "number" ? input.percentage : null;
    const dob = input.dob ?? null;
    const resolvedCollegeId =
      normalizeOptionalString(input.college_id) ?? currentUser.college_id;

    if (!resolvedCollegeId) {
      throw new AppError(
        "Student does not have a college mapping. Please assign a college first.",
        400,
      );
    }

    let profilePhotoUrl: string | null = null;
    if (input.profilePhoto) {
      const ext = input.profilePhoto.originalname.split(".").pop() || "jpg";
      const key = `profiles/${studentId}/${uuidv4()}.${ext}`;
      profilePhotoUrl = await uploadFile(
        key,
        input.profilePhoto.buffer,
        input.profilePhoto.mimetype,
      );
    }

    let resumeUrl: string | null = null;
    if (input.resumeFile) {
      const allowedResumeMimeTypes = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);

      if (!allowedResumeMimeTypes.has(input.resumeFile.mimetype)) {
        throw new AppError("Resume must be a PDF or DOC/DOCX file", 400);
      }
      if (input.resumeFile.size > 2 * 1024 * 1024) {
        throw new AppError("Resume file size must be 2MB or less", 400);
      }

      const ext = input.resumeFile.originalname.split(".").pop() || "pdf";
      const key = `resumes/${studentId}/${uuidv4()}.${ext}`;
      resumeUrl = await uploadFile(
        key,
        input.resumeFile.buffer,
        input.resumeFile.mimetype,
      );
    }

    if (
      input.name !== undefined ||
      input.first_name !== undefined ||
      input.middle_name !== undefined ||
      input.last_name !== undefined ||
      input.email !== undefined ||
      input.college_id !== undefined ||
      input.phone_number !== undefined ||
      input.dob !== undefined
    ) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             college_id = COALESCE($3, college_id),
             phone_number = COALESCE($4, phone_number),
             dob = COALESCE($5, dob),
             updated_at = NOW()
         WHERE id = $6`,
        [
          normalizedName,
          normalizedEmail,
          resolvedCollegeId,
          primaryPhone,
          dob,
          studentId,
        ],
      );
    }

    if (
      input.first_name !== undefined ||
      input.middle_name !== undefined ||
      input.last_name !== undefined ||
      input.college_id !== undefined ||
      input.phone_number !== undefined ||
      input.alternate_email !== undefined ||
      input.alternate_phone !== undefined ||
      input.dob !== undefined ||
      input.gender !== undefined ||
      input.degree !== undefined ||
      input.specialization !== undefined ||
      input.major !== undefined ||
      input.class_name !== undefined ||
      input.class !== undefined ||
      input.section !== undefined ||
      input.passing_year !== undefined ||
      input.graduation_year !== undefined ||
      input.cgpa !== undefined ||
      input.percentage !== undefined ||
      input.roll_number !== undefined ||
      input.student_identifier !== undefined ||
      input.skills !== undefined ||
      input.linkedin_url !== undefined ||
      input.github_url !== undefined ||
      profilePhotoUrl !== null ||
      resumeUrl !== null
    ) {
      await client.query(
        `INSERT INTO student_details
            (user_id, college_id, first_name, middle_name, last_name,
             student_identifier, phone_number, alternate_email, alternate_phone,
             dob, gender, degree, specialization, class_name, section,
             passing_year, cgpa, percentage, resume_url, skills,
             linkedin_url, github_url, face_photo_url, updated_at)
         VALUES
            ($1, $2, $3, $4, $5,
             $6, $7, $8, $9,
             $10, $11, $12, $13, $14, $15,
             $16, $17, $18, $19, $20,
             $21, $22, $23, NOW())
         ON CONFLICT (user_id) DO UPDATE
           SET college_id = COALESCE(EXCLUDED.college_id, student_details.college_id),
               first_name = COALESCE(EXCLUDED.first_name, student_details.first_name),
               middle_name = COALESCE(EXCLUDED.middle_name, student_details.middle_name),
               last_name = COALESCE(EXCLUDED.last_name, student_details.last_name),
               student_identifier = COALESCE(EXCLUDED.student_identifier, student_details.student_identifier),
               phone_number = COALESCE(EXCLUDED.phone_number, student_details.phone_number),
               alternate_email = COALESCE(EXCLUDED.alternate_email, student_details.alternate_email),
               alternate_phone = COALESCE(EXCLUDED.alternate_phone, student_details.alternate_phone),
               dob = COALESCE(EXCLUDED.dob, student_details.dob),
               gender = COALESCE(EXCLUDED.gender, student_details.gender),
               degree = COALESCE(EXCLUDED.degree, student_details.degree),
               specialization = COALESCE(EXCLUDED.specialization, student_details.specialization),
               class_name = COALESCE(EXCLUDED.class_name, student_details.class_name),
               section = COALESCE(EXCLUDED.section, student_details.section),
               passing_year = COALESCE(EXCLUDED.passing_year, student_details.passing_year),
               cgpa = COALESCE(EXCLUDED.cgpa, student_details.cgpa),
               percentage = COALESCE(EXCLUDED.percentage, student_details.percentage),
               resume_url = COALESCE(EXCLUDED.resume_url, student_details.resume_url),
               skills = COALESCE(EXCLUDED.skills, student_details.skills),
               linkedin_url = COALESCE(EXCLUDED.linkedin_url, student_details.linkedin_url),
               github_url = COALESCE(EXCLUDED.github_url, student_details.github_url),
               face_photo_url = COALESCE(EXCLUDED.face_photo_url, student_details.face_photo_url),
               updated_at = NOW()`,
        [
          studentId,
          resolvedCollegeId,
          firstName,
          middleName,
          lastName,
          rollNumber,
          primaryPhone,
          alternateEmail,
          alternatePhone,
          dob,
          gender,
          degree,
          specialization,
          className,
          section,
          passingYear,
          cgpa,
          percentage,
          resumeUrl,
          skills,
          linkedinUrl,
          githubUrl,
          profilePhotoUrl,
        ],
      );
    }

    const profileStatusResult = await client.query<{ is_complete: boolean }>(
      `SELECT EXISTS (
          SELECT 1
          FROM users u
          JOIN student_details sd ON sd.user_id = u.id
          WHERE u.id = $1
            AND LOWER(u.role::text) = 'student'
            AND COALESCE(NULLIF(sd.first_name, ''), NULLIF(SPLIT_PART(COALESCE(u.name, ''), ' ', 1), '')) IS NOT NULL
            AND COALESCE(NULLIF(sd.last_name, ''), NULLIF(TRIM(REGEXP_REPLACE(COALESCE(u.name, ''), '^\\S+\\s*', '')), '')) IS NOT NULL
            AND sd.dob IS NOT NULL
            AND COALESCE(NULLIF(sd.phone_number, ''), NULLIF(u.phone_number, '')) IS NOT NULL
            AND sd.degree IS NOT NULL
            AND sd.specialization IS NOT NULL
            AND sd.passing_year IS NOT NULL
            AND (sd.cgpa IS NOT NULL OR sd.percentage IS NOT NULL)
            AND sd.student_identifier IS NOT NULL
            AND sd.resume_url IS NOT NULL
       ) AS is_complete`,
      [studentId],
    );
    const isComplete = profileStatusResult.rows[0]?.is_complete ?? false;

    await client.query(
      `UPDATE users
       SET is_profile_complete = CASE
         WHEN LOWER(role::text) = 'student' THEN $2
         ELSE TRUE
       END,
       updated_at = NOW()
       WHERE id = $1`,
      [studentId, isComplete],
    );

    const updatedUserResult = await client.query<{
      id: string;
      role: string;
      name: string;
      email: string;
      college_id: string | null;
      department: string | null;
      phone_number: string | null;
      dob: Date | null;
      is_profile_complete: boolean;
    }>(
      `SELECT id, role, name, email, college_id, department, phone_number, dob, is_profile_complete
       FROM users
       WHERE id = $1`,
      [studentId],
    );

    await client.query("COMMIT");
    return { success: true, user: updatedUserResult.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");

    const dbErr = err as { code?: string; constraint?: string };
    if (dbErr.code === "23505" && dbErr.constraint === "users_email_key") {
      throw new AppError("Email already registered", 409);
    }

    throw err;
  } finally {
    client.release();
  }
}

export async function deleteStudent(studentId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM student_details WHERE user_id = $1", [studentId]);
    await client.query("DELETE FROM users WHERE id = $1", [studentId]);

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
