-- Billing & Subscription System
-- Complete billing infrastructure for monetization

-- Subscription Plans (tiered pricing)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(50) NOT NULL,                      -- 'free', 'starter', 'professional', 'enterprise'
  price_per_month DECIMAL(10, 2) NOT NULL,
  price_per_year DECIMAL(10, 2),
  max_students INT,                               -- null = unlimited
  max_drives INT,
  max_assessments INT,
  features JSONB,                                 -- { "proctoring": true, "ai_grading": true, ... }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_plan_tier UNIQUE(tier)
);

-- College Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,

  status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'cancelled', 'expired'
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'annual'

  -- Billing
  current_amount DECIMAL(10, 2),                  -- Amount due for current period
  amount_paid DECIMAL(10, 2) DEFAULT 0,

  -- Period tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  renewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment method
  payment_method VARCHAR(50),                     -- 'stripe', 'razorpay', 'bank_transfer'
  payment_method_id VARCHAR(255),                 -- Stripe or Razorpay ID

  -- Auto-renewal
  auto_renew BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_subscription_college FOREIGN KEY (college_id) REFERENCES colleges(id)
);

-- Invoices
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

  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'overdue', 'cancelled'
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,

  -- Payment reference
  payment_id VARCHAR(255),                        -- Stripe or Razorpay transaction ID
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Contacts (who to bill)
CREATE TABLE IF NOT EXISTS billing_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  designation VARCHAR(100),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Tax info
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),

  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_billing_college FOREIGN KEY (college_id) REFERENCES colleges(id)
);

-- Usage Tracking (for metered billing if needed)
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  metric_name VARCHAR(100) NOT NULL,              -- 'students_active', 'assessments_created', 'api_calls', etc.
  metric_value INT NOT NULL DEFAULT 0,

  month DATE NOT NULL,                            -- YYYY-MM-01 for aggregation

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_metric_per_month UNIQUE(college_id, metric_name, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_college_id ON subscriptions(college_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_college_id ON invoices(college_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_contacts_college_id ON billing_contacts(college_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_college_id ON usage_metrics(college_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
