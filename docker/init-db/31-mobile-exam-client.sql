-- Mobile exam client support: track whether a proctored session runs on web or mobile app.
ALTER TABLE drive_students
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) NOT NULL DEFAULT 'web';

COMMENT ON COLUMN drive_students.client_type IS 'Exam client: web | mobile_app';

CREATE INDEX IF NOT EXISTS idx_ds_client_type ON drive_students (client_type);
