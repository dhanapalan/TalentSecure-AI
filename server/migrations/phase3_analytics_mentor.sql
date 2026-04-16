-- =============================================================================
-- GradLogic Phase 3 Migration
-- Enhanced Analytics · Mentor Workflows · Notification Triggers
-- =============================================================================

-- ── Mentor Assignments ────────────────────────────────────────────────────────
-- Maps mentors (users with role='mentor') to students they oversee

CREATE TABLE IF NOT EXISTS mentor_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_id   UUID REFERENCES colleges(id) ON DELETE SET NULL,
  assigned_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_assign_mentor  ON mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assign_student ON mentor_assignments(student_id);

-- ── Mentor Sessions ───────────────────────────────────────────────────────────
-- Log of 1:1 sessions between mentor and student

CREATE TABLE IF NOT EXISTS mentor_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type    TEXT DEFAULT 'one_on_one',   -- one_on_one, group, async
  duration_mins   INT DEFAULT 30,
  notes           TEXT,                         -- mentor's private notes
  feedback        TEXT,                         -- shared with student
  action_items    JSONB DEFAULT '[]',           -- [{task, due_date, done}]
  session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor  ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student ON mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_date    ON mentor_sessions(session_date DESC);

-- ── Student Readiness Scores (computed cache) ─────────────────────────────────
-- Composite readiness score updated after each assessment / practice session

CREATE TABLE IF NOT EXISTS student_readiness (
  student_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  readiness_score      NUMERIC(5,2) DEFAULT 0,  -- 0–100
  xp_component         NUMERIC(5,2) DEFAULT 0,
  practice_component   NUMERIC(5,2) DEFAULT 0,
  drive_component      NUMERIC(5,2) DEFAULT 0,
  skill_component      NUMERIC(5,2) DEFAULT 0,
  last_computed        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Drive Analytics Snapshots ─────────────────────────────────────────────────
-- Pre-aggregated per-drive stats so leaderboard queries stay fast

CREATE TABLE IF NOT EXISTS drive_analytics (
  drive_id          UUID PRIMARY KEY REFERENCES assessment_drives(id) ON DELETE CASCADE,
  total_students    INT DEFAULT 0,
  submitted_count   INT DEFAULT 0,
  avg_score         NUMERIC(5,2) DEFAULT 0,
  median_score      NUMERIC(5,2) DEFAULT 0,
  pass_rate         NUMERIC(5,2) DEFAULT 0,   -- % scoring above cutoff
  top_25_threshold  NUMERIC(5,2) DEFAULT 0,
  score_buckets     JSONB DEFAULT '{}',        -- {"0-20":n,"21-40":n,...}
  category_avg      JSONB DEFAULT '{}',        -- {category: avg_score}
  computed_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Add 'mentor' to user_role enum if not present ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'mentor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'mentor';
  END IF;
END$$;
