-- ============================================================================
-- workflows.category — backs the SuperAdmin nav's category-filtered views
-- (Aptitude & Reasoning / Soft Skills / Technical Skills). Idempotent.
-- ============================================================================

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Backfill pre-existing rows so they stay visible in the category views.
UPDATE workflows SET category = 'aptitude' WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category) WHERE deleted_at IS NULL;
