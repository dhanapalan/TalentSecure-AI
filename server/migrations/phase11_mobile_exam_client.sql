-- Phase 11: Mobile exam client type on drive_students
ALTER TABLE drive_students
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) NOT NULL DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_ds_client_type ON drive_students (client_type);
