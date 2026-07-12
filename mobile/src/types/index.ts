export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  college_id?: string | null;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  requires2FA?: boolean;
  challengeToken?: string;
}

export interface Enrollment {
  enrollment_id: string;
  program_id: string;
  program_name: string;
  program_description?: string;
  status: string;
  total_modules: number;
  completed_modules: number;
  avg_score?: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description?: string;
  module_type: string;
  duration_minutes?: number;
  content_url?: string;
  progress_status?: string;
  order_index: number;
}

export interface PracticeTopic {
  topic: string;
  total_questions: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface PracticeQuestion {
  id: string;
  question_text: string;
  options: string[] | Record<string, string>;
  type: string;
}

export interface Drive {
  drive_id: string;
  drive_name: string;
  rule_name: string;
  duration_minutes: number;
  total_questions: number;
  session_id: string;
  session_status: string;
  score: number | null;
  time_remaining_seconds: number | null;
}

export interface ExamQuestion {
  id: string;
  question_text: string;
  options: string[] | Record<string, string>;
  type: string;
  marks: number;
  sort_order: number;
}

export interface GamificationSummary {
  total_xp: number;
  level: number;
  current_streak: number;
  badges_earned: number;
}
