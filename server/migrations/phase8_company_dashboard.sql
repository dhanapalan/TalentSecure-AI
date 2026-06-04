-- =============================================================================
-- Phase 8 — Company Dashboard
-- 1. companies — profile data for users with role = 'company'
-- 2. pipeline_stage on drive_students — per-drive candidate pipeline state
-- =============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL DEFAULT '',
  industry      VARCHAR(100),
  website       VARCHAR(500),
  logo_url      VARCHAR(500),
  description   TEXT,
  headquarters  VARCHAR(200),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);

-- Pipeline stage per (drive, student) — extends existing drive_students
ALTER TABLE drive_students
  ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(30) NOT NULL DEFAULT 'pending';
  -- Values: pending | shortlisted | interview_scheduled | offered | rejected

CREATE INDEX IF NOT EXISTS idx_ds_pipeline ON drive_students(pipeline_stage);
