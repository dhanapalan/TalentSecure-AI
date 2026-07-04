-- ============================================================================
-- system_settings — key/value store backing the SuperAdmin Settings and
-- AI Configuration pages. Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Seed defaults (only when the key doesn't exist yet)
INSERT INTO system_settings (key, value)
SELECT v.key, v.value::jsonb
FROM (VALUES
  -- Platform
  ('platform.name',                 '"GradLogic"'),
  ('platform.support_email',        '"support@gradlogic.com"'),
  ('platform.maintenance_mode',     'false'),
  ('platform.allow_registrations',  'true'),
  -- Billing
  ('billing.fee_per_student',       '500'),
  ('billing.academic_year',         '"2026-27"'),
  -- Security / backup
  ('security.password_min_length',  '8'),
  ('security.session_timeout_hours','168'),
  ('security.enforce_2fa',          'false'),
  ('backup.auto_enabled',           'true'),
  ('backup.frequency',              '"daily"'),
  ('backup.retention_days',         '30'),
  -- AI configuration
  ('ai.provider',                   '"groq"'),
  ('ai.model',                      '"llama-3.3-70b-versatile"'),
  ('ai.temperature',                '0.4'),
  ('ai.max_tokens',                 '2048'),
  ('ai.prompt_mcq',                 '"Generate {count} multiple-choice questions on {topic} at {difficulty} difficulty. Each question needs 4 options, exactly one correct answer, and a short explanation."'),
  ('ai.prompt_explanation',         '"Explain why option {answer} is correct for the following question, in 2-3 sentences a student can understand."'),
  ('ai.quota_daily_generations',    '200'),
  ('ai.quota_monthly_tokens',       '2000000'),
  ('ai.quota_per_college_daily',    '50')
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM system_settings s WHERE s.key = v.key);
