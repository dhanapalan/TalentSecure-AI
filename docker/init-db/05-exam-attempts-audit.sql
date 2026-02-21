-- =============================================================================
-- TalentSecure AI — Exam Attempts & Admin Audit Logs Migration
-- =============================================================================
-- Adds:
--   1. exam_attempt_status ENUM
--   2. admin_audit_action  ENUM
--   3. exam_attempts table  — tracks in-progress / interrupted / resumed exams
--   4. admin_audit_logs table — immutable audit trail for admin actions
--   5. RLS policies for both tables
--
-- Idempotent — safe to run on an existing database.
-- =============================================================================


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. ENUM: exam_attempt_status
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_attempt_status') THEN
    CREATE TYPE exam_attempt_status AS ENUM (
      'in_progress',
      'interrupted',
      'completed',
      'reset'
    );
  END IF;
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. ENUM: admin_audit_action
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_audit_action') THEN
    CREATE TYPE admin_audit_action AS ENUM (
      'EXAM_RESET',
      'EXAM_RESUMED'
    );
  END IF;
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. TABLE: exam_attempts
-- ═════════════════════════════════════════════════════════════════════════════
-- Tracks every student's attempt at an exam, including saved progress,
-- current question index, and whether the attempt was interrupted / resumed.

CREATE TABLE IF NOT EXISTS exam_attempts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id              UUID                NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  exam_id                 UUID                NOT NULL REFERENCES exams(id)  ON DELETE CASCADE,
  status                  exam_attempt_status NOT NULL DEFAULT 'in_progress',
  current_question_index  INT                 NOT NULL DEFAULT 0,
  saved_answers           JSONB               NOT NULL DEFAULT '{}'::jsonb,
  started_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  last_saved_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,

  -- A student should have at most one active (non-completed, non-reset) attempt per exam
  CONSTRAINT chk_question_index_positive CHECK (current_question_index >= 0)
);

-- Composite index for fast lookups: "get the latest attempt for student + exam"
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam
  ON exam_attempts (student_id, exam_id);

-- Filter by status (e.g. find all interrupted attempts)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status
  ON exam_attempts (status);

-- GIN index on saved_answers for JSONB queries (optional analytics)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_answers_gin
  ON exam_attempts USING GIN (saved_answers);


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. TABLE: admin_audit_logs
-- ═════════════════════════════════════════════════════════════════════════════
-- Immutable audit trail for administrative actions on student exam attempts.
-- No UPDATE or DELETE should ever be performed on this table.

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID               NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
  student_id  UUID               NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  exam_id     UUID               NOT NULL REFERENCES exams(id)  ON DELETE CASCADE,
  action      admin_audit_action NOT NULL,
  reason      TEXT               NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Index: find all audit entries for a specific student + exam
CREATE INDEX IF NOT EXISTS idx_audit_logs_student_exam
  ON admin_audit_logs (student_id, exam_id);

-- Index: find all actions by a specific admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin
  ON admin_audit_logs (admin_id);

-- Index: filter by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON admin_audit_logs (action);


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Row Level Security (RLS) — exam_attempts
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- 5a. Super admins / admins — full access
DROP POLICY IF EXISTS ea_super_admin_all ON exam_attempts;
CREATE POLICY ea_super_admin_all ON exam_attempts
  FOR ALL
  USING (auth_role() IN ('super_admin', 'admin'));

-- 5b. College admins — read all attempts for exams they created
DROP POLICY IF EXISTS ea_college_admin_select ON exam_attempts;
CREATE POLICY ea_college_admin_select ON exam_attempts
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND exam_id IN (SELECT id FROM exams WHERE created_by = auth_uid())
  );

-- 5c. HR / Engineer / CxO — read-only corporate view
DROP POLICY IF EXISTS ea_corporate_select ON exam_attempts;
CREATE POLICY ea_corporate_select ON exam_attempts
  FOR SELECT
  USING (auth_role() IN ('hr', 'cxo', 'engineer'));

-- 5d. Students — can read their own attempts
DROP POLICY IF EXISTS ea_student_select ON exam_attempts;
CREATE POLICY ea_student_select ON exam_attempts
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND student_id = auth_uid()
  );

-- 5e. Students — can insert new attempts (start an exam)
DROP POLICY IF EXISTS ea_student_insert ON exam_attempts;
CREATE POLICY ea_student_insert ON exam_attempts
  FOR INSERT
  WITH CHECK (
    auth_role() = 'student'
    AND student_id = auth_uid()
  );

-- 5f. Students — can update only their own in-progress attempts
--     (save answers, update question index, mark as interrupted)
DROP POLICY IF EXISTS ea_student_update ON exam_attempts;
CREATE POLICY ea_student_update ON exam_attempts
  FOR UPDATE
  USING (
    auth_role() = 'student'
    AND student_id = auth_uid()
    AND status IN ('in_progress', 'interrupted')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Row Level Security (RLS) — admin_audit_logs
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6a. Super admins / admins — full read + insert (never update/delete)
DROP POLICY IF EXISTS aal_super_admin_all ON admin_audit_logs;
CREATE POLICY aal_super_admin_all ON admin_audit_logs
  FOR ALL
  USING (auth_role() IN ('super_admin', 'admin'));

-- 6b. College admins — can read audit logs for their own exams and insert
DROP POLICY IF EXISTS aal_college_admin_select ON admin_audit_logs;
CREATE POLICY aal_college_admin_select ON admin_audit_logs
  FOR SELECT
  USING (
    auth_role() = 'college_admin'
    AND exam_id IN (SELECT id FROM exams WHERE created_by = auth_uid())
  );

DROP POLICY IF EXISTS aal_college_admin_insert ON admin_audit_logs;
CREATE POLICY aal_college_admin_insert ON admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth_role() = 'college_admin'
    AND admin_id = auth_uid()
  );

-- 6c. HR / CxO — read-only for compliance
DROP POLICY IF EXISTS aal_corporate_select ON admin_audit_logs;
CREATE POLICY aal_corporate_select ON admin_audit_logs
  FOR SELECT
  USING (auth_role() IN ('hr', 'cxo'));

-- 6d. Students — can read audit entries that reference them (transparency)
DROP POLICY IF EXISTS aal_student_select ON admin_audit_logs;
CREATE POLICY aal_student_select ON admin_audit_logs
  FOR SELECT
  USING (
    auth_role() = 'student'
    AND student_id = auth_uid()
  );

-- NOTE: Students can NEVER insert, update, or delete audit logs.
-- NOTE: No role should ever UPDATE or DELETE audit log rows (immutable by design).
--       If needed, enforce via a trigger:

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs is immutable — UPDATE and DELETE are forbidden';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE OR DELETE ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_mutation();
