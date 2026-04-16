-- =============================================================================
-- GradLogic Phase 4 Migration
-- Placement Tracking · Email Logs
-- =============================================================================

-- ── Placement Records ─────────────────────────────────────────────────────────
-- Formal placement record once a student accepts an offer

CREATE TABLE IF NOT EXISTS placement_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drive_id        UUID REFERENCES assessment_drives(id) ON DELETE SET NULL,
  college_id      UUID REFERENCES colleges(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  role_title      TEXT,
  package_lpa     NUMERIC(6,2),              -- CTC in LPA
  offer_type      TEXT DEFAULT 'full_time',  -- full_time, internship, ppo
  placed_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  joining_date    DATE,
  placed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, drive_id)               -- one placement per drive per student
);

CREATE INDEX IF NOT EXISTS idx_placement_student   ON placement_records(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_college   ON placement_records(college_id);
CREATE INDEX IF NOT EXISTS idx_placement_drive     ON placement_records(drive_id);
CREATE INDEX IF NOT EXISTS idx_placement_placed_at ON placement_records(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_company   ON placement_records(company_name);

-- ── Email Audit Log ───────────────────────────────────────────────────────────
-- Tracks every email sent so we can avoid duplicates and debug delivery

CREATE TABLE IF NOT EXISTS email_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_email     TEXT NOT NULL,
  subject      TEXT NOT NULL,
  template     TEXT NOT NULL,               -- drive_invite, shortlist, offer, badge, etc.
  ref_id       UUID,                        -- drive_id / badge_id / placement_id
  status       TEXT DEFAULT 'sent',         -- sent, failed, skipped
  error        TEXT,
  sent_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template  ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at   ON email_logs(sent_at DESC);
