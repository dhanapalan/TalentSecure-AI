-- =============================================================================
-- TalentSecure AI — Supabase Clean Reset
-- Run this FIRST in the SQL Editor to wipe the partial schema, then re-run
-- the init-db SQL files in order (01 → 09 + Prisma migration).
-- =============================================================================

-- Drop all custom tables (CASCADE handles FK dependencies automatically)
DROP TABLE IF EXISTS
  drive_pool_audit_logs,
  proctoring_incidents,
  proctoring_events,
  drive_students,
  drive_assignments,
  drive_pool_questions,
  drive_question_pool,
  assessment_drives,
  assessment_rule_versions,
  assessment_rule_templates,
  student_summary,
  notifications,
  rbac_audit_logs,
  audit_logs,
  exam_attempts,
  exam_questions,
  question_bank,
  marks_scored,
  cheating_logs,
  exams,
  student_details,
  colleges,
  users
CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS user_role         CASCADE;
DROP TYPE IF EXISTS violation_type    CASCADE;
DROP TYPE IF EXISTS drive_status      CASCADE;
DROP TYPE IF EXISTS pool_status       CASCADE;
DROP TYPE IF EXISTS session_status    CASCADE;
DROP TYPE IF EXISTS question_type     CASCADE;
DROP TYPE IF EXISTS difficulty_level  CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Confirm
SELECT 'Clean reset complete — safe to run 01-schema.sql now' AS status;
