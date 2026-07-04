-- College Approval Workflow
-- Add status fields to track college onboarding approval state

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS rejection_at TIMESTAMPTZ;

-- Add foreign key for who approved
ALTER TABLE colleges
  ADD CONSTRAINT fk_colleges_approved_by
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Index for filtering pending colleges
CREATE INDEX IF NOT EXISTS idx_colleges_approval_status ON colleges(approval_status);
CREATE INDEX IF NOT EXISTS idx_colleges_pending ON colleges(approval_status) WHERE approval_status = 'pending';
