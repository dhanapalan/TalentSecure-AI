-- =============================================================================
-- TalentSecure AI — PostgreSQL Schema
-- =============================================================================
-- Auto-executed on first container start via docker-entrypoint-initdb.d
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM Types ───────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'admin',        -- legacy super admin
  'super_admin',
  'college',      -- legacy college admin
  'college_admin',
  'college_staff',
  'student',
  'hr',
  'cxo',
  'engineer'
);

CREATE TYPE violation_type AS ENUM (
    'face_not_detected',
    'multiple_faces',
    'face_mismatch',
    'tab_switch',
    'browser_minimized',
    'copy_paste_attempt',
    'right_click',
    'screen_share_detected',
    'devtools_open',
    'external_display',
    'network_anomaly'
);

-- =============================================================================
-- 1. users
-- =============================================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role        user_role    NOT NULL,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role  ON users (role);
CREATE INDEX idx_users_email ON users (email);

-- =============================================================================
-- 2. student_details
-- =============================================================================
CREATE TABLE student_details (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    face_photo_url VARCHAR(500),
    id_photo_url   VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_student_role CHECK (
        -- enforced at app level: user_id must reference a user with role='student'
        TRUE
    )
);

CREATE INDEX idx_student_details_user_id    ON student_details (user_id);
CREATE INDEX idx_student_details_college_id ON student_details (college_id);

-- =============================================================================
-- 3. exams
-- =============================================================================
CREATE TABLE exams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(300) NOT NULL,
    scheduled_time  TIMESTAMPTZ  NOT NULL,
    duration        INT          NOT NULL,              -- duration in minutes
    created_by      UUID         REFERENCES users(id),  -- admin or college who created
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exams_scheduled ON exams (scheduled_time);

-- =============================================================================
-- 4. cheating_logs
-- =============================================================================
CREATE TABLE cheating_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id         UUID            NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    timestamp       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    violation_type  violation_type  NOT NULL,
    risk_score      NUMERIC(5,2)    NOT NULL DEFAULT 0.00,  -- 0.00 – 100.00
    screenshot_url  VARCHAR(500),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cheating_logs_student ON cheating_logs (student_id);
CREATE INDEX idx_cheating_logs_exam    ON cheating_logs (exam_id);
CREATE INDEX idx_cheating_logs_pair    ON cheating_logs (student_id, exam_id);

-- =============================================================================
-- 5. marks_scored
-- =============================================================================
CREATE TABLE marks_scored (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id     UUID         NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    final_score NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_marks_student_exam UNIQUE (student_id, exam_id)
);

CREATE INDEX idx_marks_student ON marks_scored (student_id);
CREATE INDEX idx_marks_exam    ON marks_scored (exam_id);

-- =============================================================================
-- Auto-update updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_student_details_updated_at
    BEFORE UPDATE ON student_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_marks_scored_updated_at
    BEFORE UPDATE ON marks_scored
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Seed: default admin user (password: admin123 — bcrypt hash)
-- =============================================================================
INSERT INTO users (role, name, email, password) VALUES
    ('admin', 'Admin User', 'admin@nallastalent.ai',
     crypt('admin123', gen_salt('bf', 12)));
