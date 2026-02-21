import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool, query, queryOne } from "../config/database.js";
import { uploadFile } from "../config/storage.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRow, StudentDetailRow, ExamRow } from "../types/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  college_id: string;
  webcamPhoto?: Express.Multer.File;
}

interface CompleteOnboardingInput {
  university: string;
  degree: string;
  major: string;
  graduation_year: number;
  cgpa: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Student Registration
// ─────────────────────────────────────────────────────────────────────────────

export async function registerStudent(input: RegisterStudentInput) {
  const existing = await queryOne<UserRow>(
    "SELECT id FROM users WHERE email = $1",
    [input.email],
  );
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const campus = await queryOne<{ id: string }>(
    "SELECT id FROM campuses WHERE id = $1",
    [input.college_id],
  );
  if (!campus) {
    throw new AppError("Invalid campus selection", 400);
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

    const names = input.name.split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ");

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (role, first_name, last_name, email, password, college_id, is_active)
       VALUES ('STUDENT', $1, $2, $3, $4, $5, TRUE)
       RETURNING id, role, email, college_id, created_at`,
      [firstName, lastName, input.email, hashedPassword, campus.id],
    );
    const user = userResult.rows[0];

    const profileResult = await client.query(
      `INSERT INTO student_profiles (user_id, campus_id, first_name, last_name, email, photo_url, university, degree, major, graduation_year, cgpa)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 'Pending', 'Pending', 2025, 0.0)
       RETURNING id`,
      [user.id, campus.id, firstName, lastName, user.email, facePhotoUrl],
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. Exam Schedule for a Student
// ─────────────────────────────────────────────────────────────────────────────

export async function getExamScheduleForStudent(studentUserId: string) {
  // 1. Get the student's campus
  const student = await queryOne<{ college_id: string }>(
    "SELECT college_id FROM users WHERE id = $1 AND role = 'STUDENT'",
    [studentUserId]
  );
  if (!student) throw new AppError("Student not found", 404);

  // 2. Fetch exams assigned to this campus
  const exams = await query(
    `SELECT 
            a.*, 
            r.title as role_title, 
            r.company as role_company,
            (SELECT score FROM assessment_sessions WHERE assessment_id = a.id AND student_id = sp.id LIMIT 1) as score
         FROM assessments a
         JOIN assessment_campuses ac ON ac.assessment_id = a.id
         JOIN roles r ON r.id = a.role_id
         JOIN student_profiles sp ON sp.user_id = $1
         WHERE ac.campus_id = $2
         ORDER BY a.scheduled_at ASC`,
    [studentUserId, student.college_id]
  );

  return exams;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Student onboarding completion
// ─────────────────────────────────────────────────────────────────────────────

export async function listStudents(limit = 50, offset = 0) {
  const students = await query(
    `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.college_id, u.created_at,
        sp.university, sp.degree, sp.major, sp.graduation_year, sp.cgpa, sp.photo_url,
        c.name as college_name
     FROM users u
     JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN campuses c ON c.id = u.college_id
     WHERE u.role = 'STUDENT'
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return students;
}

export async function updateStudent(studentId: string, input: Partial<RegisterStudentInput & CompleteOnboardingInput>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (input.name || input.email) {
      const names = input.name?.split(" ") || [];
      const firstName = names[0];
      const lastName = names.slice(1).join(" ");

      await client.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name), 
             last_name = COALESCE($2, last_name),
             email = COALESCE($3, email),
             updated_at = NOW()
         WHERE id = $4`,
        [firstName || null, lastName || null, input.email || null, studentId]
      );
    }

    await client.query(
      `UPDATE student_profiles
       SET university = COALESCE($2, university),
           degree = COALESCE($3, degree),
           major = COALESCE($4, major),
           graduation_year = COALESCE($5, graduation_year),
           cgpa = COALESCE($6, cgpa),
           updated_at = NOW()
       WHERE user_id = $1`,
      [
        studentId,
        input.university || null,
        input.degree || null,
        input.major || null,
        input.graduation_year || null,
        input.cgpa || null,
      ]
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteStudent(studentId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Order matters: profile first then user
    await client.query("DELETE FROM student_profiles WHERE user_id = $1", [studentId]);
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
