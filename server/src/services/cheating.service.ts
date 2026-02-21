import { query, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { CheatingLogRow, ViolationType } from "../types/index.js";

interface CreateCheatingLogInput {
  student_id: string;
  exam_id: string;
  violation_type: ViolationType;
  risk_score: number;
  screenshot_url?: string;
}

/**
 * Insert a cheating log row (called by the AI engine).
 */
export async function createCheatingLog(input: CreateCheatingLogInput) {
  // Verify student exists
  const student = await queryOne(
    "SELECT id FROM users WHERE id = $1 AND role = 'student'",
    [input.student_id],
  );
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // Verify exam exists
  const exam = await queryOne(
    "SELECT id FROM exams WHERE id = $1",
    [input.exam_id],
  );
  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  const log = await queryOne<CheatingLogRow>(
    `INSERT INTO cheating_logs
            (student_id, exam_id, violation_type, risk_score, screenshot_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.student_id,
      input.exam_id,
      input.violation_type,
      input.risk_score,
      input.screenshot_url ?? null,
    ],
  );

  return log;
}

/**
 * List cheating logs with student name and exam title.
 */
export async function listCheatingLogs(limit = 50, offset = 0) {
  return query<CheatingLogRow & { student_name: string; exam_title: string }>(
    `SELECT cl.*,
            u.name  AS student_name,
            e.title AS exam_title
     FROM   cheating_logs cl
     JOIN   users u ON u.id = cl.student_id
     JOIN   exams e ON e.id = cl.exam_id
     ORDER  BY cl.timestamp DESC
     LIMIT  $1 OFFSET $2`,
    [limit, offset],
  );
}

/**
 * Count all cheating log rows.
 */
export async function countCheatingLogs() {
  const result = await queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM cheating_logs",
  );
  return parseInt(result?.count || "0", 10);
}

/**
 * Count cheating logs with risk_score > threshold.
 */
export async function countHighRiskAlerts(threshold = 70) {
  const result = await queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM cheating_logs WHERE risk_score > $1",
    [threshold],
  );
  return parseInt(result?.count || "0", 10);
}

/**
 * Dashboard summary stats for admin view.
 */
export async function getDashboardStats() {
  const [totalLogs, highRisk, uniqueStudents, activeExams] = await Promise.all([
    countCheatingLogs(),
    countHighRiskAlerts(70),
    queryOne<{ count: string }>(
      "SELECT COUNT(DISTINCT student_id) AS count FROM cheating_logs",
    ),
    queryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM exams WHERE is_active = TRUE",
    ),
  ]);
  return {
    totalViolations: totalLogs,
    highRiskAlerts: highRisk,
    uniqueStudentsFlagged: parseInt(uniqueStudents?.count || "0", 10),
    activeExams: parseInt(activeExams?.count || "0", 10),
  };
}

// ── Risk-score defaults for student-reported violations ─────────────────────

const VIOLATION_RISK_MAP: Record<string, number> = {
  tab_switch: 60,
  browser_minimized: 70,
  copy_paste_attempt: 40,
  right_click: 20,
  devtools_open: 80,
  screen_share_detected: 90,
};

/**
 * Create a cheating log from a student's own browser event (JWT auth).
 */
export async function createStudentViolation(
  studentId: string,
  examId: string,
  violationType: ViolationType,
) {
  const riskScore = VIOLATION_RISK_MAP[violationType] ?? 50;
  return createCheatingLog({
    student_id: studentId,
    exam_id: examId,
    violation_type: violationType,
    risk_score: riskScore,
  });
}
