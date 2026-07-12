-- ============================================================================
-- Billing subscription plans (prisma/migrations/20260703_billing_system).
-- deploy.sh only applies docker/init-db — keep this in sync so /api/billing/plans
-- does not 500 with "relation subscription_plans does not exist".
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(50) NOT NULL,
  price_per_month DECIMAL(10, 2) NOT NULL,
  price_per_year DECIMAL(10, 2),
  max_students INT,
  max_drives INT,
  max_assessments INT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_plan_tier UNIQUE (tier)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  current_amount DECIMAL(10, 2),
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  renewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_method_id VARCHAR(255),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  amount_due DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  payment_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  designation VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (name, description, tier, price_per_month, price_per_year, max_students, max_drives, max_assessments, features)
VALUES
  ('Free', 'Getting started', 'free', 0, 0, 50, 2, 10, '{"proctoring": false}'::jsonb),
  ('Starter', 'Small campuses', 'starter', 999, 9990, 500, 20, 100, '{"proctoring": true}'::jsonb),
  ('Professional', 'Growing institutions', 'professional', 2999, 29990, 2000, 100, 500, '{"proctoring": true, "ai_grading": true}'::jsonb),
  ('Enterprise', 'Unlimited scale', 'enterprise', 7999, 79990, NULL, NULL, NULL, '{"proctoring": true, "ai_grading": true, "sso": true}'::jsonb)
ON CONFLICT (tier) DO NOTHING;
