-- =============================================================================
-- TalentSecure AI — RBAC & Multi-Tenancy Migration
-- =============================================================================
-- Adds enterprise RBAC roles, multi-tenancy columns, exam metadata, and
-- Row Level Security (RLS) policies for Supabase.
--
-- Idempotent — safe to run on an existing database.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Expand the user_role ENUM with new roles
-- ═════════════════════════════════════════════════════════════════════════════
-- Existing values: admin, college, college_staff, student
-- Target:          super_admin, hr, engineer, cxo, college_admin, student
-- We ADD the missing labels; old labels remain valid for backward compat.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'hr'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'hr';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'engineer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'engineer';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'cxo'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'cxo';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'college_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'college_admin';
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Extend the users table for RBAC + multi-tenancy
-- ═════════════════════════════════════════════════════════════════════════════
-- college_id already exists from 02-college-student-onboarding.sql.
-- We add department (for corporate HR/Engineer/CxO users).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_users_department ON users (department);

-- Composite index for fast tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_role_college ON users (role, college_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Extend the exams table with total_questions & duration_minutes
-- ═════════════════════════════════════════════════════════════════════════════
-- 'duration' (minutes as INT) already exists. We add an explicit alias plus
-- total_questions for assessment metadata.

ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Backfill duration_minutes from the legacy 'duration' column
UPDATE exams SET duration_minutes = duration WHERE duration_minutes IS NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. Backfill existing 'college' users → 'college_admin'
-- ═════════════════════════════════════════════════════════════════════════════
-- Remap the legacy 'college' role to the new 'college_admin' role so all
-- college-registered accounts gain the correct RBAC label.
-- ⚠  PostgreSQL enum values cannot be renamed, and we can't easily UPDATE
--    to a value added in the SAME transaction (enum values are only visible
--    after commit). So we wrap this in a DO block with an exception handler.

DO $$
BEGIN
  UPDATE users SET role = 'college_admin' WHERE role = 'college';
EXCEPTION WHEN invalid_text_representation THEN
  -- If the enum value isn't committed yet, skip — next run will catch it.
  RAISE NOTICE 'Skipping college → college_admin backfill (enum not yet visible)';
END $$;

-- Also promote the default admin → super_admin
DO $$
BEGIN
  UPDATE users SET role = 'super_admin' WHERE role = 'admin';
EXCEPTION WHEN invalid_text_representation THEN
  RAISE NOTICE 'Skipping admin → super_admin backfill (enum not yet visible)';
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Row Level Security (RLS) Policies for Supabase
-- ═════════════════════════════════════════════════════════════════════════════
-- Supabase sets `auth.uid()` to the authenticated user's ID via the JWT.
-- We use a helper function to extract the role and college_id from the JWT
-- claims so RLS policies can reference them efficiently.

-- ── Helper: extract current user's role from JWT ────────────────────────────

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'role',
    'anonymous'
  );
$$;

-- ── Helper: extract current user's college_id from JWT ──────────────────────

CREATE OR REPLACE FUNCTION auth_college_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (
    current_setting('request.jwt.claims', true)::json ->> 'college_id'
  )::UUID;
$$;

-- ── Helper: extract current user's id from JWT ──────────────────────────────

CREATE OR REPLACE FUNCTION auth_uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (
    current_setting('request.jwt.claims', true)::json ->> 'userId'
  )::UUID;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5a. RLS on users table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Super admins can see everything
DROP POLICY IF EXISTS users_super_admin_all ON users;
CREATE POLICY users_super_admin_all ON users
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins can only see users belonging to their college
DROP POLICY IF EXISTS users_college_admin_select ON users;
CREATE POLICY users_college_admin_select ON users
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND college_id = auth_college_id()
  );

-- College admins can update only their own college's users
DROP POLICY IF EXISTS users_college_admin_update ON users;
CREATE POLICY users_college_admin_update ON users
  FOR UPDATE
  USING (
    auth_role() = 'college_admin'
    AND college_id = auth_college_id()
  );

-- Students can only read their own row
DROP POLICY IF EXISTS users_student_self ON users;
CREATE POLICY users_student_self ON users
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND id = auth_uid()
  );

-- HR / CxO / Engineers see all users (corporate view)
DROP POLICY IF EXISTS users_corporate_select ON users;
CREATE POLICY users_corporate_select ON users
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5b. RLS on student_details table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS sd_super_admin_all ON student_details;
CREATE POLICY sd_super_admin_all ON student_details
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins can view/edit student_details belonging to their college
DROP POLICY IF EXISTS sd_college_admin_select ON student_details;
CREATE POLICY sd_college_admin_select ON student_details
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND college_id = auth_college_id()
  );

DROP POLICY IF EXISTS sd_college_admin_update ON student_details;
CREATE POLICY sd_college_admin_update ON student_details
  FOR UPDATE
  USING (
    auth_role() = 'college_admin'
    AND college_id = auth_college_id()
  );

-- Students see only their own details
DROP POLICY IF EXISTS sd_student_self ON student_details;
CREATE POLICY sd_student_self ON student_details
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND user_id = auth_uid()
  );

-- Corporate roles (HR/CxO) can read all student details (recruiting view)
DROP POLICY IF EXISTS sd_corporate_select ON student_details;
CREATE POLICY sd_corporate_select ON student_details
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5c. RLS on exams table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS exams_super_admin_all ON exams;
CREATE POLICY exams_super_admin_all ON exams
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins see only exams they created
DROP POLICY IF EXISTS exams_college_admin_select ON exams;
CREATE POLICY exams_college_admin_select ON exams
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND created_by = auth_uid()
  );

-- College admins can create exams (INSERT always allowed for them)
DROP POLICY IF EXISTS exams_college_admin_insert ON exams;
CREATE POLICY exams_college_admin_insert ON exams
  FOR INSERT
  WITH CHECK (
    auth_role() = 'college_admin'
  );

-- Students can see active exams only
DROP POLICY IF EXISTS exams_student_select ON exams;
CREATE POLICY exams_student_select ON exams
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND is_active = TRUE
  );

-- Corporate roles full read
DROP POLICY IF EXISTS exams_corporate_select ON exams;
CREATE POLICY exams_corporate_select ON exams
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5d. RLS on cheating_logs table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE cheating_logs ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS cl_super_admin_all ON cheating_logs;
CREATE POLICY cl_super_admin_all ON cheating_logs
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins see logs for students in their college
DROP POLICY IF EXISTS cl_college_admin_select ON cheating_logs;
CREATE POLICY cl_college_admin_select ON cheating_logs
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND student_id IN (
      SELECT id FROM users WHERE college_id = auth_college_id()
    )
  );

-- Students see their own logs (transparency)
DROP POLICY IF EXISTS cl_student_self ON cheating_logs;
CREATE POLICY cl_student_self ON cheating_logs
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND student_id = auth_uid()
  );

-- Any authenticated user can INSERT a log (proctoring writes)
DROP POLICY IF EXISTS cl_insert_any ON cheating_logs;
CREATE POLICY cl_insert_any ON cheating_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5e. RLS on marks_scored table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE marks_scored ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS ms_super_admin_all ON marks_scored;
CREATE POLICY ms_super_admin_all ON marks_scored
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins see scores for their college's students
DROP POLICY IF EXISTS ms_college_admin_select ON marks_scored;
CREATE POLICY ms_college_admin_select ON marks_scored
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND student_id IN (
      SELECT id FROM users WHERE college_id = auth_college_id()
    )
  );

-- Students see own scores
DROP POLICY IF EXISTS ms_student_self ON marks_scored;
CREATE POLICY ms_student_self ON marks_scored
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND student_id = auth_uid()
  );

-- Corporate roles full read
DROP POLICY IF EXISTS ms_corporate_select ON marks_scored;
CREATE POLICY ms_corporate_select ON marks_scored
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5f. RLS on question_bank table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS qb_super_admin_all ON question_bank;
CREATE POLICY qb_super_admin_all ON question_bank
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins can read active questions and manage questions they created
DROP POLICY IF EXISTS qb_college_admin_select ON question_bank;
CREATE POLICY qb_college_admin_select ON question_bank
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND is_active = TRUE
  );

DROP POLICY IF EXISTS qb_college_admin_modify ON question_bank;
CREATE POLICY qb_college_admin_modify ON question_bank
  FOR ALL
  USING (
    auth_role() = 'college_admin'
    AND created_by = auth_uid()
  );

-- HR / CxO read-only access to active questions
DROP POLICY IF EXISTS qb_corporate_select ON question_bank;
CREATE POLICY qb_corporate_select ON question_bank
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
    AND is_active = TRUE
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5g. RLS on colleges table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- Super admins full access
DROP POLICY IF EXISTS colleges_super_admin_all ON colleges;
CREATE POLICY colleges_super_admin_all ON colleges
  FOR ALL
  USING (auth_role() = 'super_admin');

-- College admins can only read their own college
DROP POLICY IF EXISTS colleges_college_admin_select ON colleges;
CREATE POLICY colleges_college_admin_select ON colleges
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND id = auth_college_id()
  );

-- Students can read their own college
DROP POLICY IF EXISTS colleges_student_select ON colleges;
CREATE POLICY colleges_student_select ON colleges
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND id = (SELECT college_id FROM users WHERE id = auth_uid())
  );

-- Corporate roles read all colleges
DROP POLICY IF EXISTS colleges_corporate_select ON colleges;
CREATE POLICY colleges_corporate_select ON colleges
  FOR SELECT
  USING (
    auth_role() IN ('hr', 'cxo', 'engineer')
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Seed: enterprise demo users
-- ═════════════════════════════════════════════════════════════════════════════
-- Passwords: gradlogic123 for all users

INSERT INTO users (role, name, email, password, department) VALUES
  ('hr',       'HR Manager',       'hr@gradlogic.com',
   crypt('gradlogic123', gen_salt('bf', 12)),       'Human Resources'),
  ('engineer', 'Lead Engineer',    'engineer@gradlogic.com',
   crypt('gradlogic123', gen_salt('bf', 12)), 'Engineering'),
  ('cxo',      'Chief Technology Officer', 'cto@gradlogic.com',
   crypt('gradlogic123', gen_salt('bf', 12)),      'Executive Leadership')
ON CONFLICT (email) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- Done.  Summary of changes:
--   • user_role ENUM: +super_admin, +hr, +engineer, +cxo, +college_admin
--   • users table:    +department, composite idx(role, college_id)
--   • exams table:    +total_questions, +duration_minutes
--   • RLS policies:   users, student_details, exams, cheating_logs,
--                     marks_scored, question_bank, colleges
--   • Helper fns:     auth_role(), auth_college_id(), auth_uid()
--   • Seed users:     hr, engineer, cxo
-- ═════════════════════════════════════════════════════════════════════════════
