-- ============================================================================
-- Phase 2 Admin Schema — roles, permissions, audit_logs, workflows
-- Reconciles the Phase 2 superadmin controllers with the real database.
-- Idempotent: safe to run repeatedly and on fresh volumes.
-- ============================================================================

-- ── 1. users: compatibility columns the Phase 2 controllers expect ──────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name  VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone      VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status     VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id    UUID;

-- Backfill compat columns from the canonical columns (name / phone_number / is_active)
UPDATE users
   SET full_name = COALESCE(full_name, name),
       phone     = COALESCE(phone, phone_number),
       status    = COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END);

-- Keep compat columns populated for rows written by the legacy/main app flow,
-- without clobbering values the Phase 2 controllers set explicitly.
CREATE OR REPLACE FUNCTION sync_user_compat_columns() RETURNS trigger AS $$
BEGIN
  NEW.full_name := COALESCE(NEW.full_name, NEW.name);
  NEW.phone     := COALESCE(NEW.phone, NEW.phone_number);
  NEW.status    := COALESCE(NEW.status, CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_compat ON users;
CREATE TRIGGER trg_sync_user_compat
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_compat_columns();

CREATE INDEX IF NOT EXISTS idx_users_status     ON users(status)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role_id    ON users(role_id);

-- ── 2. colleges: soft-delete column used by analytics/superadmin queries ────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── 3. roles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_active_uidx ON roles(name) WHERE deleted_at IS NULL;

INSERT INTO roles (name, description, is_system)
SELECT v.name, v.description, true
FROM (VALUES
  ('super_admin',   'Full platform administration'),
  ('college_admin', 'College administration'),
  ('tpo',           'Training & Placement Officer'),
  ('mentor',        'Mentor / trainer'),
  ('student',       'Student')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.name = v.name AND r.deleted_at IS NULL);

-- Link existing users to role rows by name (populates per-role user_count)
UPDATE users u
   SET role_id = r.id
  FROM roles r
 WHERE r.name = u.role::text
   AND u.role_id IS DISTINCT FROM r.id;

-- ── 4. permissions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(50) NOT NULL,
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_uidx ON permissions(name) WHERE deleted_at IS NULL;

INSERT INTO permissions (name, description, category)
SELECT v.name, v.description, v.category
FROM (VALUES
  ('users_view',       'View users',                'users'),
  ('users_manage',     'Create, update, delete users', 'users'),
  ('roles_view',       'View roles',                'roles'),
  ('roles_manage',     'Create, update, delete roles', 'roles'),
  ('colleges_view',    'View colleges',             'colleges'),
  ('colleges_manage',  'Manage colleges',           'colleges'),
  ('workflows_view',   'View workflows',            'workflows'),
  ('workflows_manage', 'Manage workflows',          'workflows'),
  ('audit_view',       'View audit trail',          'audit'),
  ('audit_export',     'Export audit logs',         'audit'),
  ('analytics_view',   'View analytics dashboards', 'analytics')
) AS v(name, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.name = v.name AND p.deleted_at IS NULL);

-- ── 5. role_permissions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Grant every permission to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND r.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ── 6. audit_logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   VARCHAR(100),
  changes       JSONB,
  ip_address    VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action        ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON audit_logs(user_id);

-- ── 7. workflows (+ steps, conditions) ──────────────────────────────────────
-- id is TEXT because the controller generates ids like 'wf_1720080000000'
CREATE TABLE IF NOT EXISTS workflows (
  id            TEXT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  trigger_event VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_workflows_active  ON workflows(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_event);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name        VARCHAR(200),
  type        VARCHAR(50),
  config      JSONB,
  order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

CREATE TABLE IF NOT EXISTS workflow_conditions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  field       VARCHAR(100),
  operator    VARCHAR(30),
  value       TEXT
);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_workflow_id ON workflow_conditions(workflow_id);
