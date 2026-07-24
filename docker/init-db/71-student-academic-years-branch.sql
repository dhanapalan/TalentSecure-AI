-- Student academic span + branch (replaces single "passing year" UX).
-- Idempotent for existing databases.
-- Apply on existing Postgres: psql … < docker/init-db/71-student-academic-years-branch.sql

ALTER TABLE student_details
  ADD COLUMN IF NOT EXISTS academic_start_year INT,
  ADD COLUMN IF NOT EXISTS academic_end_year INT,
  ADD COLUMN IF NOT EXISTS branch VARCHAR(150);

-- Backfill from legacy columns
UPDATE student_details
SET academic_end_year = passing_year
WHERE academic_end_year IS NULL AND passing_year IS NOT NULL;

UPDATE student_details
SET branch = specialization
WHERE (branch IS NULL OR BTRIM(branch) = '')
  AND specialization IS NOT NULL
  AND BTRIM(specialization) <> '';

-- Keep legacy columns filled when new columns are present (compat readers)
UPDATE student_details
SET passing_year = academic_end_year
WHERE passing_year IS NULL AND academic_end_year IS NOT NULL;

UPDATE student_details
SET specialization = branch
WHERE (specialization IS NULL OR BTRIM(specialization) = '')
  AND branch IS NOT NULL
  AND BTRIM(branch) <> '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_details_academic_start_year'
  ) THEN
    ALTER TABLE student_details
      ADD CONSTRAINT chk_student_details_academic_start_year
      CHECK (
        academic_start_year IS NULL
        OR (academic_start_year >= 1900 AND academic_start_year <= 2200)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_details_academic_end_year'
  ) THEN
    ALTER TABLE student_details
      ADD CONSTRAINT chk_student_details_academic_end_year
      CHECK (
        academic_end_year IS NULL
        OR (academic_end_year >= 1900 AND academic_end_year <= 2200)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_details_academic_span'
  ) THEN
    ALTER TABLE student_details
      ADD CONSTRAINT chk_student_details_academic_span
      CHECK (
        academic_start_year IS NULL
        OR academic_end_year IS NULL
        OR academic_start_year <= academic_end_year
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_details_academic_end_year
  ON student_details (academic_end_year);

CREATE INDEX IF NOT EXISTS idx_student_details_academic_start_year
  ON student_details (academic_start_year);

CREATE INDEX IF NOT EXISTS idx_student_details_branch
  ON student_details (branch);
