-- =============================================================================
-- 70 — College master identification / location / contact fields
-- Extends colleges for Add College (superadmin) + profile completeness.
-- Idempotent.
-- =============================================================================

ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS establishment_year INT,
  ADD COLUMN IF NOT EXISTS institution_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS ownership VARCHAR(50),
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS admission_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS principal_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS naac_grade VARCHAR(10),
  ADD COLUMN IF NOT EXISTS total_students INT;

-- Ensure profile columns exist even if 59 was skipped on older volumes
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS university VARCHAR(255),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS country VARCHAR(120) DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_colleges_institution_type'
  ) THEN
    ALTER TABLE colleges
      ADD CONSTRAINT chk_colleges_institution_type
      CHECK (
        institution_type IS NULL OR institution_type IN (
          'University',
          'Autonomous College',
          'Affiliated College',
          'Deemed University',
          'Others'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_colleges_ownership'
  ) THEN
    ALTER TABLE colleges
      ADD CONSTRAINT chk_colleges_ownership
      CHECK (
        ownership IS NULL OR ownership IN (
          'Government',
          'Private',
          'Deemed',
          'Trust',
          'Society'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_colleges_establishment_year'
  ) THEN
    ALTER TABLE colleges
      ADD CONSTRAINT chk_colleges_establishment_year
      CHECK (
        establishment_year IS NULL
        OR (establishment_year >= 1800 AND establishment_year <= EXTRACT(YEAR FROM CURRENT_DATE)::INT)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_colleges_pin_code_in'
  ) THEN
    ALTER TABLE colleges
      ADD CONSTRAINT chk_colleges_pin_code_in
      CHECK (
        pin_code IS NULL
        OR pin_code ~ '^[0-9]{6}$'
        OR country IS DISTINCT FROM 'India'
      );
  END IF;
END $$;

-- Unique official name (case-insensitive). Skipped if duplicates already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_colleges_name_ci'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX uq_colleges_name_ci
        ON colleges (LOWER(TRIM(name)))
        WHERE deleted_at IS NULL;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'uq_colleges_name_ci skipped: duplicate college names already present';
    END;
  END IF;
END $$;
