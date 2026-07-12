-- ============================================================================
-- colleges compatibility columns for the superadmin college controller.
-- The base colleges table only carries name/college_code; approval + contact
-- + status fields are added here. Idempotent.
-- ============================================================================

-- Approval workflow (also in prisma/migrations/20260703_college_approval;
-- deploy.sh only applies docker/init-db, so keep both in sync)
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS rejection_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_colleges_approved_by'
  ) THEN
    ALTER TABLE colleges
      ADD CONSTRAINT fk_colleges_approved_by
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_colleges_approval_status ON colleges(approval_status);
CREATE INDEX IF NOT EXISTS idx_colleges_pending ON colleges(approval_status)
  WHERE approval_status = 'pending';

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS status  VARCHAR(20) DEFAULT 'pending';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS email   VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS phone   VARCHAR(30);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS city    VARCHAR(120);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS state   VARCHAR(120);
-- Declared in prisma schema; used by approve/reject + campus bulk actions
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed status from the existing approval_status so filters behave sensibly.
UPDATE colleges
   SET status = COALESCE(
     status,
     CASE approval_status::text
       WHEN 'approved' THEN 'active'
       WHEN 'rejected' THEN 'suspended'
       ELSE 'pending'
     END
   );

CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status) WHERE deleted_at IS NULL;
