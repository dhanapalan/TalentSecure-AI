-- =============================================================================
-- TalentSecure AI — RBAC Audit Logging Table
-- =============================================================================
-- Stores all security-relevant actions for the RBAC system.
-- Includes: exam resets, student/campus CRUD, login events, permission denials.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_role VARCHAR(50) NOT NULL,
    actor_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    exam_id UUID,
    student_id UUID,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbac_audit_actor ON rbac_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_action ON rbac_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_created ON rbac_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_target ON rbac_audit_logs(target_type, target_id);

-- =============================================================================
-- Ensure RBAC roles exist in the user_role enum
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cxo' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cxo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'engineer' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'engineer';
    END IF;
END$$;
