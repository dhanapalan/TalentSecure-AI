-- =============================================================================
-- TalentSecure AI — Drives, Question Pools, Sessions & Proctoring Schema
-- =============================================================================
-- Creates all tables required for the recruitment drive workflow.
-- Must run AFTER 01-schema.sql and 02-college-student-onboarding.sql.
-- Safe to re-run: all statements use IF NOT EXISTS / DO blocks.
-- =============================================================================

-- =============================================================================
-- 1. assessment_rule_templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS assessment_rule_templates (
    id                        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                      VARCHAR(255) NOT NULL,
    description               TEXT,
    target_role               VARCHAR(100),
    duration_minutes          INT          NOT NULL DEFAULT 60,
    total_questions           INT          NOT NULL DEFAULT 30,
    total_marks               INT          NOT NULL DEFAULT 100,
    negative_marking_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    negative_marking_value    NUMERIC(4,2),
    sectional_cutoff          JSONB,
    overall_cutoff            NUMERIC(5,2),
    skill_distribution        JSONB        NOT NULL DEFAULT '{}',
    difficulty_distribution   JSONB        NOT NULL DEFAULT '{}',
    proctoring_mode           VARCHAR(20)  NOT NULL DEFAULT 'moderate',
    proctoring_config         JSONB,
    pool_generation_config    JSONB,
    targeting_config          JSONB,
    status                    VARCHAR(30)  NOT NULL DEFAULT 'draft',
    version                   INT          NOT NULL DEFAULT 1,
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_art_status     ON assessment_rule_templates (status);
CREATE INDEX IF NOT EXISTS idx_art_created_by ON assessment_rule_templates (created_by);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_art_updated_at') THEN
    CREATE TRIGGER trg_art_updated_at
      BEFORE UPDATE ON assessment_rule_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- =============================================================================
-- 2. assessment_rule_versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS assessment_rule_versions (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id        UUID        NOT NULL REFERENCES assessment_rule_templates(id) ON DELETE CASCADE,
    version_number INT         NOT NULL,
    snapshot       JSONB       NOT NULL DEFAULT '{}',
    change_notes   TEXT,
    created_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked      BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_rule_version UNIQUE (rule_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_arv_rule_id ON assessment_rule_versions (rule_id);

-- =============================================================================
-- 3. assessment_drives
-- =============================================================================
CREATE TABLE IF NOT EXISTS assessment_drives (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                  VARCHAR(255) NOT NULL,
    rule_id               UUID        NOT NULL REFERENCES assessment_rule_templates(id),
    rule_version_id       UUID        REFERENCES assessment_rule_versions(id),
    rule_snapshot         JSONB,
    status                VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    scheduled_start       TIMESTAMPTZ,
    scheduled_end         TIMESTAMPTZ,
    actual_start          TIMESTAMPTZ,
    actual_end            TIMESTAMPTZ,
    total_students        INT          NOT NULL DEFAULT 0,
    auto_publish          BOOLEAN      NOT NULL DEFAULT FALSE,
    allow_mock            BOOLEAN      NOT NULL DEFAULT FALSE,
    attempt_limit         INT          NOT NULL DEFAULT 1,
    duration_minutes      INT,
    shuffle_questions     BOOLEAN      NOT NULL DEFAULT FALSE,
    auto_submit           BOOLEAN      NOT NULL DEFAULT TRUE,
    proctoring_mode       VARCHAR(30)  NOT NULL DEFAULT 'standard',
    tab_switch_limit      INT          NOT NULL DEFAULT 3,
    face_detection_required BOOLEAN    NOT NULL DEFAULT FALSE,
    max_applicants        INT                   DEFAULT 500,
    created_by            UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_status    ON assessment_drives (status);
CREATE INDEX IF NOT EXISTS idx_ad_rule      ON assessment_drives (rule_id);
CREATE INDEX IF NOT EXISTS idx_ad_scheduled ON assessment_drives (scheduled_start, scheduled_end);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ad_updated_at') THEN
    CREATE TRIGGER trg_ad_updated_at
      BEFORE UPDATE ON assessment_drives
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- =============================================================================
-- 4. drive_question_pool  (one pool per drive)
-- =============================================================================
CREATE TABLE IF NOT EXISTS drive_question_pool (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id                UUID        NOT NULL UNIQUE REFERENCES assessment_drives(id) ON DELETE CASCADE,
    version                 INT         NOT NULL DEFAULT 1,
    total_generated         INT         NOT NULL DEFAULT 0,
    skill_distribution      JSONB,
    difficulty_distribution JSONB,
    generation_status       VARCHAR(30) NOT NULL DEFAULT 'generating',
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending',
    validation_score        NUMERIC(5,2),
    is_locked               BOOLEAN     NOT NULL DEFAULT FALSE,
    approved_by             UUID        REFERENCES users(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dqp_drive ON drive_question_pool (drive_id);

-- =============================================================================
-- 5. drive_pool_questions
-- =============================================================================
CREATE TABLE IF NOT EXISTS drive_pool_questions (
    id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id             UUID         NOT NULL REFERENCES assessment_drives(id) ON DELETE CASCADE,
    pool_id              UUID         NOT NULL REFERENCES drive_question_pool(id) ON DELETE CASCADE,
    question_text        TEXT         NOT NULL,
    options              JSONB,
    correct_answer       TEXT,
    skill                VARCHAR(100),
    difficulty           VARCHAR(20),
    marks                NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    ai_metadata          JSONB,
    status               VARCHAR(30)  NOT NULL DEFAULT 'pending',
    quality_score        NUMERIC(5,2),
    duplicate_similarity NUMERIC(5,2),
    sort_order           INT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpq_pool           ON drive_pool_questions (pool_id);
CREATE INDEX IF NOT EXISTS idx_dpq_drive_skill    ON drive_pool_questions (drive_id, skill);
CREATE INDEX IF NOT EXISTS idx_dpq_drive_diff     ON drive_pool_questions (drive_id, difficulty);

-- =============================================================================
-- 6. drive_students  (student enrollment in a drive)
-- =============================================================================
CREATE TABLE IF NOT EXISTS drive_students (
    id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id               UUID         NOT NULL REFERENCES assessment_drives(id) ON DELETE CASCADE,
    student_id             UUID         NOT NULL REFERENCES users(id),
    paper_id               UUID         UNIQUE DEFAULT uuid_generate_v4(),
    question_mapping       JSONB,
    status                 VARCHAR(30)  NOT NULL DEFAULT 'assigned',
    eligibility_status     VARCHAR(30),
    integrity_score        NUMERIC(5,2),
    score                  NUMERIC(6,2),
    violations             INT          NOT NULL DEFAULT 0,
    saved_answers          JSONB        NOT NULL DEFAULT '{}',
    current_question_index INT          NOT NULL DEFAULT 0,
    time_remaining_seconds INT,
    started_at             TIMESTAMPTZ,
    completed_at           TIMESTAMPTZ,
    last_heartbeat         TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_drive_student UNIQUE (drive_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ds_drive   ON drive_students (drive_id);
CREATE INDEX IF NOT EXISTS idx_ds_student ON drive_students (student_id);
CREATE INDEX IF NOT EXISTS idx_ds_status  ON drive_students (status);

-- =============================================================================
-- 7. drive_assignments  (campus/college assignments to a drive)
-- =============================================================================
CREATE TABLE IF NOT EXISTS drive_assignments (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id   UUID        NOT NULL REFERENCES assessment_drives(id) ON DELETE CASCADE,
    college_id UUID        REFERENCES colleges(id) ON DELETE CASCADE,
    segment    VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_da_drive   ON drive_assignments (drive_id);
CREATE INDEX IF NOT EXISTS idx_da_college ON drive_assignments (college_id);

-- =============================================================================
-- 8. proctoring_events  (per-event log during an exam session)
-- =============================================================================
CREATE TABLE IF NOT EXISTS proctoring_events (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID        NOT NULL REFERENCES drive_students(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    metadata   JSONB,
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pe_session   ON proctoring_events (session_id);
CREATE INDEX IF NOT EXISTS idx_pe_timestamp ON proctoring_events (session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_pe_type      ON proctoring_events (event_type);

-- =============================================================================
-- 9. proctoring_incidents  (flagged incident summaries per session)
-- =============================================================================
CREATE TABLE IF NOT EXISTS proctoring_incidents (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID        NOT NULL REFERENCES drive_students(id) ON DELETE CASCADE,
    status     VARCHAR(30) NOT NULL DEFAULT 'pending',
    risk_level VARCHAR(20),
    score      INT         NOT NULL DEFAULT 100,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pi_session ON proctoring_incidents (session_id);
CREATE INDEX IF NOT EXISTS idx_pi_status  ON proctoring_incidents (status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pi_updated_at') THEN
    CREATE TRIGGER trg_pi_updated_at
      BEFORE UPDATE ON proctoring_incidents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- =============================================================================
-- 10. drive_pool_audit_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS drive_pool_audit_logs (
    id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id            UUID        NOT NULL REFERENCES drive_question_pool(id) ON DELETE CASCADE,
    action             VARCHAR(50) NOT NULL,
    target_question_id UUID,
    actor_id           UUID        NOT NULL REFERENCES users(id),
    before_snapshot    JSONB,
    after_snapshot     JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpal_pool  ON drive_pool_audit_logs (pool_id);
CREATE INDEX IF NOT EXISTS idx_dpal_actor ON drive_pool_audit_logs (actor_id);
