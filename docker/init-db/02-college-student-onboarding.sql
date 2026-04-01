-- =============================================================================
-- TalentSecure AI — College + Student Onboarding Migration
-- =============================================================================
-- This script is idempotent and safe to run on an existing database.
-- =============================================================================

-- Note: all user_role enum values (including college_staff) are defined in 01-schema.sql

-- 1) Create colleges table.
CREATE TABLE IF NOT EXISTS colleges (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_code   VARCHAR(50)  NOT NULL UNIQUE,
  name           VARCHAR(255) NOT NULL,
  legacy_user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges (name);
CREATE INDEX IF NOT EXISTS idx_colleges_legacy_user_id ON colleges (legacy_user_id);

-- 2) Extend users for college mapping + onboarding.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_college_id ON users (college_id);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number);

-- 3) Extend student_details for onboarding fields.
ALTER TABLE student_details
  ADD COLUMN IF NOT EXISTS student_identifier VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS degree VARCHAR(150),
  ADD COLUMN IF NOT EXISTS class_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS section VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_details_college_student_identifier
  ON student_details (college_id, student_identifier)
  WHERE student_identifier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_details_degree ON student_details (degree);
CREATE INDEX IF NOT EXISTS idx_student_details_class_section ON student_details (class_name, section);

-- 4) Backfill colleges from legacy "college" users.
INSERT INTO colleges (college_code, name, legacy_user_id, created_by)
SELECT
  LOWER('col-' || REPLACE(u.id::text, '-', '')),
  u.name,
  u.id,
  u.id
FROM users u
WHERE u.role = 'college'
ON CONFLICT (legacy_user_id) DO NOTHING;

-- 5) Backfill users.college_id from legacy data.
UPDATE users u
SET college_id = c.id
FROM colleges c
WHERE c.legacy_user_id = u.id
  AND u.college_id IS NULL;

UPDATE users u
SET college_id = c.id
FROM student_details sd
JOIN colleges c ON c.legacy_user_id = sd.college_id
WHERE u.id = sd.user_id
  AND u.college_id IS NULL;

-- 6) Move student_details.college_id FK target from users -> colleges.
UPDATE student_details sd
SET college_id = c.id
FROM colleges c
WHERE c.legacy_user_id = sd.college_id;

ALTER TABLE student_details
  DROP CONSTRAINT IF EXISTS student_details_college_id_fkey;

ALTER TABLE student_details
  ADD CONSTRAINT student_details_college_id_fkey
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE;

-- 7) Seed student_details.phone_number from users.phone_number when possible.
UPDATE student_details sd
SET phone_number = u.phone_number
FROM users u
WHERE u.id = sd.user_id
  AND sd.phone_number IS NULL
  AND u.phone_number IS NOT NULL;

-- 8) Backfill profile completion:
-- non-student roles are considered complete by default.
UPDATE users
SET is_profile_complete = TRUE
WHERE role IN ('admin', 'college', 'college_staff');

-- existing students are complete only if all onboarding fields exist.
UPDATE users u
SET is_profile_complete = TRUE
FROM student_details sd
WHERE u.id = sd.user_id
  AND u.role = 'student'
  AND sd.dob IS NOT NULL
  AND sd.degree IS NOT NULL
  AND sd.class_name IS NOT NULL
  AND sd.section IS NOT NULL;

-- 9) Keep colleges.updated_at in sync.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_colleges_updated_at'
  ) THEN
    CREATE TRIGGER trg_colleges_updated_at
      BEFORE UPDATE ON colleges
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
