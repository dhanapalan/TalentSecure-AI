-- ============================================================================
-- SuperAdmin content schema — categories, announcements, email_templates,
-- certifications + question_bank/exam_attempts soft-delete & status columns.
-- Reconciles superadmin.controller.ts with the real database. Idempotent.
-- ============================================================================

-- ── categories (question taxonomy) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uidx ON categories(slug) WHERE deleted_at IS NULL;

-- Seed with the categories the question bank already uses
INSERT INTO categories (name, slug, description)
SELECT v.name, v.slug, v.description
FROM (VALUES
  ('Reasoning',        'reasoning',        'Logical & analytical reasoning'),
  ('Aptitude',         'aptitude',         'Quantitative aptitude'),
  ('Maths',            'maths',            'Mathematics'),
  ('Data Structures',  'data_structures',  'Data structures'),
  ('Programming',      'programming',      'Programming & coding')
) AS v(name, slug, description)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.deleted_at IS NULL);

-- ── announcements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(30) DEFAULT 'info',
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ── email_templates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(150) NOT NULL,
  subject    VARCHAR(300) NOT NULL,
  body       TEXT NOT NULL,
  variables  JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── certifications (referenced by platform metrics) ─────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200),
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── question_bank: soft-delete + review status ──────────────────────────────
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_question_bank_status ON question_bank(status) WHERE deleted_at IS NULL;

-- ── exam_attempts: soft-delete column ───────────────────────────────────────
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
