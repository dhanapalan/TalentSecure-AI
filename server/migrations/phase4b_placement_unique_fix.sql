-- =============================================================================
-- Phase 4b — Fix placement_records unique constraint for NULL drive_id
--
-- PostgreSQL treats NULL != NULL in unique constraints, so the plain
-- UNIQUE(student_id, drive_id) created in phase4 never fires when drive_id
-- is NULL. Two separate partial indexes cover both cases:
--   1. Drive-linked placements: unique per (student, drive)
--   2. Direct placements (no drive): at most one per student
-- =============================================================================

-- Drop the plain constraint that does not handle NULLs correctly
ALTER TABLE placement_records
  DROP CONSTRAINT IF EXISTS placement_records_student_id_drive_id_key;

-- Partial index: one placement per student per drive (drive_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_placement_student_drive
  ON placement_records (student_id, drive_id)
  WHERE drive_id IS NOT NULL;

-- Partial index: one direct placement per student (drive_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_placement_student_direct
  ON placement_records (student_id)
  WHERE drive_id IS NULL;
