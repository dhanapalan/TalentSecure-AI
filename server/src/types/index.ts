// =============================================================================
// TalentSecure AI — Shared TypeScript Types
// Aligned with the 5-table PostgreSQL schema (01-schema.sql)
// =============================================================================

// ── Database Enums (mirror PostgreSQL enums) ─────────────────────────────────

export type UserRole =
  | "super_admin"
  | "admin"          // legacy — maps to super_admin
  | "college"        // legacy — maps to college_admin
  | "college_staff"
  | "college_admin"
  | "hr"
  | "engineer"
  | "cxo"
  | "student";

export type ViolationType =
  | "face_not_detected"
  | "multiple_faces"
  | "face_mismatch"
  | "tab_switch"
  | "browser_minimized"
  | "copy_paste_attempt"
  | "right_click"
  | "screen_share_detected"
  | "devtools_open"
  | "external_display"
  | "network_anomaly";

export type QuestionCategory =
  | "reasoning"
  | "maths"
  | "aptitude"
  | "data_structures"
  | "programming";

export type QuestionType = "multiple_choice" | "coding_challenge";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type ExamAttemptStatus = "in_progress" | "interrupted" | "completed" | "reset";

export type AdminAuditAction =
  | "EXAM_RESET"
  | "EXAM_RESUMED"
  | "CAMPUS_CREATED"
  | "CAMPUS_UPDATED"
  | "CAMPUS_DELETED"
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_DELETED"
  | "EXAM_GENERATED"
  | "EXAM_ASSIGNED"
  | "EXAM_TERMINATED"
  | "SESSION_TERMINATED"
  | "SESSION_RESET"
  | "ROLE_CREATED"
  | "USER_CREATED"
  | "USER_ROLE_CHANGED"
  | "USER_DELETED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "PERMISSION_DENIED"
  | "QUESTION_CREATED"
  | "QUESTION_UPDATED"
  | "QUESTION_DELETED"
  | "STUDENTS_BULK_ADDED";

// ── Row Types ────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  college_id?: string | null;
  department?: string | null;
  phone_number?: string | null;
  dob?: Date | null;
  is_profile_complete?: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudentDetailRow {
  id: string;
  user_id: string;
  college_id: string;
  student_identifier?: string | null;
  phone_number?: string | null;
  dob?: Date | null;
  degree?: string | null;
  class_name?: string | null;
  section?: string | null;
  face_photo_url: string | null;
  id_photo_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ExamRow {
  id: string;
  title: string;
  scheduled_time: Date;
  duration: number;
  total_questions: number;
  duration_minutes: number | null;
  created_by: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CheatingLogRow {
  id: string;
  student_id: string;
  exam_id: string;
  timestamp: Date;
  violation_type: ViolationType;
  risk_score: number;
  screenshot_url: string | null;
  created_at: Date;
}

export interface MarksScoredRow {
  id: string;
  student_id: string;
  exam_id: string;
  final_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionBankRow {
  id: string;
  category: QuestionCategory;
  type: QuestionType;
  difficulty_level: DifficultyLevel;
  question_text: string;
  options: unknown[] | null;           // JSONB array of option strings
  correct_answer: string | null;
  test_cases: TestCase[] | null;       // JSONB array
  starter_code: Record<string, string> | null; // JSONB { lang: code }
  time_limit_ms: number;
  memory_limit_kb: number;
  marks: number;
  tags: string[];
  explanation: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface ExamAttemptRow {
  id: string;
  student_id: string;
  exam_id: string;
  status: ExamAttemptStatus;
  current_question_index: number;
  saved_answers: Record<string, unknown>;
  started_at: Date;
  last_saved_at: Date;
  completed_at: Date | null;
}

export interface AdminAuditLogRow {
  id: string;
  admin_id: string;
  student_id: string;
  exam_id: string;
  action: AdminAuditAction;
  reason: string;
  created_at: Date;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  college_id: string | null;
}

// ── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
