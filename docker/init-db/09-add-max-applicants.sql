-- max_applicants is already defined in 10-drives-sessions-schema.sql
-- This file is kept for local Docker upgrade compatibility only.
ALTER TABLE assessment_drives ADD COLUMN IF NOT EXISTS max_applicants INT DEFAULT 500;
