import { query, queryOne } from "../config/database.js";

export interface ExamRow {
  id: string;
  title: string;
  scheduled_time: Date;
  duration: number;
  duration_minutes: number | null;
  total_questions: number;
  questions_per_student: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * List all exams ordered by scheduled time.
 * If collegeId is provided, only return exams assigned to that college.
 */
export async function listExams(collegeId?: string) {
  if (collegeId) {
    return query<ExamRow>(
      `SELECT e.* FROM exams e
       JOIN exam_colleges ec ON ec.exam_id = e.id
       WHERE ec.college_id = $1
       ORDER BY e.scheduled_time DESC`,
      [collegeId]
    );
  }
  return query<ExamRow>(
    "SELECT * FROM exams ORDER BY scheduled_time DESC",
  );
}

/**
 * List active assessments with their violation counts.
 * If collegeId is provided, only return exams assigned to that college.
 */
export async function listActiveExams(collegeId?: string) {
  let sql = `
    SELECT e.*,
           COALESCE(v.cnt, 0)::int AS violation_count
    FROM   exams e
    LEFT JOIN (
      SELECT cl.exam_id, COUNT(*) AS cnt
      FROM   cheating_logs cl
      GROUP  BY cl.exam_id
    ) v ON v.exam_id = e.id
  `;

  const params: any[] = [];
  if (collegeId) {
    sql += ` JOIN exam_colleges ec ON ec.exam_id = e.id WHERE ec.college_id = $1 AND e.is_active = TRUE `;
    params.push(collegeId);
  } else {
    sql += ` WHERE e.is_active = TRUE `;
  }

  sql += ` ORDER BY e.scheduled_time ASC`;

  return query<ExamRow & { violation_count: number }>(sql, params);
}

/**
 * Get a single exam by ID.
 */
export async function getExamById(id: string) {
  return queryOne<ExamRow>(
    "SELECT * FROM exams WHERE id = $1",
    [id],
  );
}

// ── Create Exam ──────────────────────────────────────────────────────────────

export interface CreateExamInput {
  title: string;
  total_questions: number;
  questions_per_student?: number | null;
  duration_minutes: number;
  created_by?: string | null;
  scheduled_at?: Date;
  status?: string;
}

export async function createExam(input: CreateExamInput) {
  const scheduledTime = input.scheduled_at ?? new Date();

  // Validate created_by FK — if the user doesn't exist (e.g. after DB reset), set null
  let createdBy = input.created_by ?? null;
  if (createdBy) {
    const userExists = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [createdBy],
    );
    if (!userExists) createdBy = null;
  }

  return queryOne<ExamRow>(
    `INSERT INTO exams
       (id, title, scheduled_time, duration, duration_minutes, total_questions,
        questions_per_student, created_by, is_active, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
     RETURNING *`,
    [
      input.title,
      scheduledTime,
      input.duration_minutes,    // duration in minutes (legacy column)
      input.duration_minutes,    // duration_minutes
      input.total_questions,
      input.questions_per_student ?? null,
      createdBy,
    ],
  );
}

/**
 * Persist curated question IDs linked to an exam.
 */
export async function persistExamQuestions(examId: string, questionIds: string[]) {
  for (let i = 0; i < questionIds.length; i++) {
    await query(
      `INSERT INTO exam_questions (exam_id, question_id, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (exam_id, question_id) DO NOTHING`,
      [examId, questionIds[i], i],
    );
  }
}

/**
 * Get all questions linked to an exam (with full question data).
 */
export async function getExamQuestions(examId: string, subsetIds: string[] | null = null) {
  if (subsetIds && subsetIds.length > 0) {
    // Return only the randomized subset for the student, in the provided order
    const placeholders = subsetIds.map((_, i) => `$${i + 2}`).join(",");
    return query(
      `SELECT qb.*, array_position(ARRAY[${placeholders}]::uuid[], qb.id) as sort_order
       FROM question_bank qb
       WHERE qb.id = ANY(ARRAY[${placeholders}]::uuid[])
       ORDER BY sort_order`,
      [examId, ...subsetIds],
    );
  }

  // Default behavior for admins: return all questions for the exam
  return query(
    `SELECT eq.sort_order, qb.*
     FROM   exam_questions eq
     JOIN   question_bank qb ON qb.id = eq.question_id
     WHERE  eq.exam_id = $1
     ORDER  BY eq.sort_order`,
    [examId],
  );
}

/**
 * Assign an exam to multiple colleges (campuses).
 */
export async function assignExamToColleges(examId: string, collegeIds: string[]) {
  for (const collegeId of collegeIds) {
    await query(
      `INSERT INTO exam_colleges (exam_id, college_id)
       VALUES ($1, $2)
       ON CONFLICT (exam_id, college_id) DO NOTHING`,
      [examId, collegeId],
    );
  }
}

/**
 * Get colleges assigned to an exam.
 */
export async function getExamColleges(examId: string) {
  return query(
    `SELECT c.* FROM exam_colleges ec
     JOIN colleges c ON c.id = ec.college_id
     WHERE ec.exam_id = $1
     ORDER BY c.name`,
    [examId],
  );
}

// ── Management Features ──────────────────────────────────────────────────────

/**
 * Get live progress of an exam (students and their status)
 */
export async function getExamProgress(examId: string, campusId?: string) {
  let sql = `
        SELECT 
            sd.id as student_id,
            sd.first_name,
            sd.last_name,
            sd.email,
            sd.college_id,
            c.name as college_name,
            ea.status as attempt_status,
            ea.id as attempt_id,
            ea.started_at,
            ea.submitted_at,
            ea.score,
            (SELECT COUNT(*) FROM cheating_logs cl 
             WHERE cl.exam_id = $1 AND cl.student_id = sd.user_id) as violation_count
        FROM student_details sd
        JOIN colleges c ON c.id = sd.college_id
        LEFT JOIN exam_attempts ea ON ea.exam_id = $1 AND ea.student_id = sd.user_id
        WHERE sd.college_id IS NOT NULL
    `;

  const params: any[] = [examId];
  if (campusId) {
    sql += ` AND sd.college_id = $2`;
    params.push(campusId);
  }

  return query(sql, params);
}

/**
 * Terminate the entire exam
 */
export async function terminateExam(examId: string) {
  // 1. Deactivate the exam
  await query("UPDATE exams SET is_active = FALSE, updated_at = NOW() WHERE id = $1", [examId]);

  // 2. Mark all in-progress attempts as interrupted
  await query(
    "UPDATE exam_attempts SET status = 'interrupted', updated_at = NOW() WHERE exam_id = $1 AND status = 'in_progress'",
    [examId]
  );
}

/**
 * Terminate a specific student session
 * If collegeId is provided, verifies that the session belongs to a student from that college.
 */
export async function terminateStudentSession(sessionId: string, collegeId?: string) {
  if (collegeId) {
    const attempt = await queryOne(
      `SELECT ea.id FROM exam_attempts ea
       JOIN users u ON u.id = ea.student_id
       WHERE ea.id = $1 AND u.college_id = $2`,
      [sessionId, collegeId]
    );
    if (!attempt) return null;
  }

  return query(
    "UPDATE exam_attempts SET status = 'interrupted', updated_at = NOW() WHERE id = $1 RETURNING *",
    [sessionId]
  );
}

/**
 * Reset a student session (delete session and proctoring data)
 * If collegeId is provided, verifies ownership first.
 */
export async function resetStudentSession(sessionId: string, collegeId?: string) {
  const attempt = await queryOne<{ exam_id: string, student_id: string }>(
    `SELECT ea.exam_id, ea.student_id FROM exam_attempts ea
     JOIN users u ON u.id = ea.student_id
     WHERE ea.id = $1 ${collegeId ? 'AND u.college_id = $2' : ''}`,
    collegeId ? [sessionId, collegeId] : [sessionId]
  );

  if (!attempt) return false;

  // Delete cheating logs for this student+exam
  await query(
    "DELETE FROM cheating_logs WHERE exam_id = $1 AND student_id = $2",
    [attempt.exam_id, attempt.student_id]
  );
  // Delete the exam attempt
  await query("DELETE FROM exam_attempts WHERE id = $1", [sessionId]);
  return true;
}
