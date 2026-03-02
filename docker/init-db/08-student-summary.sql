-- =============================================================================
-- TalentSecure AI — Student Summary Table
-- =============================================================================
-- This table denormalizes metrics for the Talent Intelligence Console
-- to allow fast KPI aggregations and advanced filtering on the College Dashboard.
-- =============================================================================

CREATE TYPE placement_status_type AS ENUM (
    'Not Shortlisted',
    'Shortlisted',
    'Interviewed',
    'Offered',
    'Joined'
);

CREATE TYPE risk_level_type AS ENUM (
    'Low',
    'Medium',
    'High'
);

CREATE TABLE IF NOT EXISTS student_summary (
    student_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    college_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avg_score           NUMERIC(6,2) DEFAULT 0.00,
    avg_integrity       NUMERIC(6,2) DEFAULT 0.00,
    latest_drive_score  NUMERIC(6,2) DEFAULT 0.00,
    placement_status    placement_status_type DEFAULT 'Not Shortlisted',
    risk_level          risk_level_type DEFAULT 'Low',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_summary_college_id ON student_summary(college_id);
CREATE INDEX IF NOT EXISTS idx_student_summary_placement ON student_summary(placement_status);
CREATE INDEX IF NOT EXISTS idx_student_summary_risk ON student_summary(risk_level);

-- Auto-update trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_summary_updated_at'
    ) THEN
        CREATE TRIGGER trg_student_summary_updated_at
            BEFORE UPDATE ON student_summary
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;
