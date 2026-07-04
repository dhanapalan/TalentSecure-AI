# TalentSecure-AI SaaS Architecture Vision

**Strategic Goal**: Transform from single-tenant multi-college platform to multi-tenant SaaS  
**Timeline**: 6-12 months (Phases 3-5)  
**Target Market**: Corporate HR teams, Educational institutions, Skill development platforms

---

## Current State vs. SaaS Vision

### Current Architecture (Phase 1-2)

```
GradLogic Platform
├── SuperAdmin (1 super admin manages everything)
├── Colleges (Multiple colleges, all in one database)
├── Students (All students across colleges)
└── Single-tenant database

Hierarchy: SuperAdmin → College → Student
```

### SaaS Vision (Phase 3-5)

```
TalentSecure SaaS Platform
├── Company 1 (ABC Corp)
│   ├── Admin
│   ├── Campuses (HQ, Regional offices, etc.)
│   │   ├── Campus Admins
│   │   ├── Mentors
│   │   └── Students/Employees
│   └── Billing & Settings
├── Company 2 (XYZ University)
│   ├── Admin
│   ├── Campuses (Main, Branch, etc.)
│   │   ├── TPO
│   │   ├── Mentors
│   │   └── Students
│   └── Billing & Settings
└── Company N (...)

Hierarchy: Tenant (Company) → Campus → Department → Users
```

---

## Architecture Layers

### 1. MULTI-TENANCY APPROACH

#### Option A: Row-Level Tenancy (Recommended for Phase 3)
```
Single database, all companies' data in same tables
Add tenant_id column to all tables

Advantages:
✅ Easier to implement
✅ Lower operational overhead
✅ Easier data migration from Phase 1
✅ Faster setup

Disadvantages:
❌ Must enforce tenant isolation at application level
❌ Requires careful query filtering
```

#### Option B: Schema-Level Tenancy (Phase 4)
```
Separate schema per company in same database

Advantages:
✅ Better data isolation
✅ Per-tenant configuration easier
✅ Simpler compliance

Disadvantages:
❌ More complex backup/restore
❌ Higher operational overhead
```

#### Option C: Database-Level Tenancy (Phase 5)
```
Separate database per company

Advantages:
✅ Maximum isolation
✅ Best for compliance (SOC 2, etc.)
✅ Can use different database versions per tenant

Disadvantages:
❌ Highest operational cost
❌ Most complex management
```

**Recommended Path**: A → B → C over 12+ months

---

## Database Schema Evolution

### Phase 1-2: Current (Single Tenant)

```sql
CREATE TABLE colleges (
  id UUID PRIMARY KEY,
  name TEXT,
  email EMAIL,
  status TEXT,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  college_id UUID,
  name TEXT,
  email EMAIL,
  ...
  FOREIGN KEY (college_id) REFERENCES colleges(id)
);
```

### Phase 3: Multi-Tenant (Row-Level)

```sql
-- Add tenant_id to all tables
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  plan TEXT ('starter', 'pro', 'enterprise'),
  max_campuses INT,
  max_students INT,
  created_at TIMESTAMP,
  ...
);

CREATE TABLE campuses (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,  -- ← Tenant identifier
  name TEXT,
  email EMAIL,
  location TEXT,
  ...
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,  -- ← Tenant identifier (denormalized for performance)
  campus_id UUID NOT NULL,
  name TEXT,
  email EMAIL,
  ...
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

-- Indexes on tenant_id for performance
CREATE INDEX idx_campuses_company_id ON campuses(company_id);
CREATE INDEX idx_students_company_id ON students(company_id);
CREATE INDEX idx_assessments_company_id ON assessments(company_id);
```

### Phase 4: Schema-Level Tenancy

```
Each company gets its own schema:
talentsecure_db.company_1.students
talentsecure_db.company_2.students
talentsecure_db.company_3.students

Shared schema for platform-level data:
talentsecure_db.public.companies
talentsecure_db.public.subscriptions
talentsecure_db.public.audit_logs
```

### Phase 5: Database-Level Tenancy

```
Separate database per company:
talentsecure_company_1_db
talentsecure_company_2_db
talentsecure_company_3_db

Plus shared metrics database:
talentsecure_metrics_db (contains analytics across all customers)
```

---

## Authentication & Authorization Evolution

### Phase 1-2: Current

```
JWT with roles:
{
  user_id: string
  role: 'super_admin' | 'college_admin' | 'student'
  college_id: string
}

Authorization: Check if user.role == 'super_admin'
```

### Phase 3: Company-Based

```
JWT with tenant awareness:
{
  user_id: string
  company_id: string,      // ← Tenant identifier
  role: 'company_admin' | 'campus_admin' | 'mentor' | 'student'
  campus_ids: [string]     // Array of campuses user belongs to
}

Middleware: Extract company_id from JWT and token
All queries: WHERE company_id = req.user.company_id
```

### Phase 4: Advanced Multi-Tenancy

```
JWT with RBAC + ABAC:
{
  user_id: string
  company_id: string
  role: string
  permissions: [string]    // Fine-grained permissions
  attributes: {            // Attribute-based access control
    department: string
    cost_center: string
    manager_id: string
  }
}

Authorization: role + permissions + attributes
Example: Can only view students from own department
```

---

## Billing & SaaS Model

### Pricing Tiers (Phase 3)

```
Plan        Price/Month  Campuses  Students  Support
────────────────────────────────────────────────────
Starter     $99         1         500       Email
Pro         $299        5         5,000     Priority
Enterprise  Custom      Unlimited Unlimited Dedicated
```

### Features by Tier

```
Starter:
  ✅ Basic assessment templates
  ✅ Student management
  ✅ Limited analytics
  ❌ Custom workflows
  ❌ API access

Pro:
  ✅ All starter features
  ✅ Custom workflows
  ✅ Advanced analytics
  ✅ API access
  ✅ 2 admin users

Enterprise:
  ✅ Everything in Pro
  ✅ Unlimited admins
  ✅ SSO (SAML/OAuth)
  ✅ Custom integrations
  ✅ SLA guarantee
  ✅ Dedicated support
```

### Billing Implementation

```
Subscription Table:
id, company_id, plan, status, current_period_start, 
current_period_end, auto_renew, stripe_subscription_id

Usage Tracking:
id, company_id, metric (students_active, assessments_run, etc),
value, period, timestamp

Overage Billing:
If students > plan limit: $0.50 per student per month
```

---

## Migration Path: Phase 1-2 → Phase 3 SaaS

### Phase 3: Multi-Tenant Foundation (2-3 months)

**Step 1: Create Company/Subscription Management**
- New tables: companies, subscriptions, billing_events
- Create CompanyAdminPortal for company self-management

**Step 2: Add Tenant ID to Database**
- Add company_id column to colleges (rename to campuses)
- Add company_id to all related tables
- Backfill existing data: 1 company for current system

**Step 3: Update Authentication**
- Modify JWT to include company_id
- Add tenant middleware to all routes
- Update authorization checks

**Step 4: Isolate Data Queries**
```typescript
// Before
const colleges = await query('SELECT * FROM colleges WHERE deleted_at IS NULL');

// After
const colleges = await query(
  'SELECT * FROM colleges WHERE company_id = $1 AND deleted_at IS NULL',
  [req.user.company_id]
);
```

**Step 5: Update Frontend Routing**
```typescript
// Before
/app/superadmin/colleges

// After
/:company/:company-slug/admin/campuses
/:company/:company-slug/admin/settings
/:company/:company-slug/admin/billing
```

### Phase 4: Multi-Tenancy Optimization (2 months)

- Implement schema-level tenancy (if needed)
- Add per-tenant configuration
- Implement feature flags by plan
- Add usage tracking and enforcement

### Phase 5: Enterprise SaaS Features (2 months)

- Database-level tenancy for enterprise customers
- SSO/SAML integration
- Advanced audit logging per company
- White-label capability
- API rate limiting per plan

---

## Data Isolation Checklist

### Query Level
- [ ] Add `WHERE company_id = ?` to all SELECT queries
- [ ] Add `AND company_id = ?` to all UPDATE queries
- [ ] Add `AND company_id = ?` to all DELETE queries
- [ ] Test that users can't see data from other companies

### API Level
- [ ] Validate company_id in JWT matches request
- [ ] Return 403 if accessing wrong company's data
- [ ] Add company_id to all API responses (for verification)

### Frontend Level
- [ ] All API calls include company context
- [ ] Redirect to company-specific URL structure
- [ ] Can't navigate to another company's data via URL

### Database Level
- [ ] Row-level security policies (if using PostgreSQL RLS)
- [ ] Regular audit of data leaks
- [ ] Backup isolation per company (Phase 5)

---

## Phased Implementation Plan

### Phase 3: Multi-Tenant Foundation (Weeks 1-12)

**Weeks 1-3: Planning & Design**
- Finalize multi-tenancy approach
- Design company self-service portal
- Plan database migration
- Design authentication changes

**Weeks 4-6: Backend Changes**
- Add company/subscription tables
- Add company_id to all tables
- Implement tenant middleware
- Update all queries for data isolation
- Create company API endpoints

**Weeks 7-9: Frontend Changes**
- Create company-aware routing
- Build company admin dashboard
- Build campus/student management per company
- Update navigation for multi-tenancy

**Weeks 10-12: Testing & Migration**
- Integration testing (data isolation)
- Security testing (can't access other companies)
- Migrate existing data to company structure
- Launch beta with select customer

### Phase 4: Advanced Features (Weeks 13-20)

- Schema-level tenancy
- Custom domains (company.talentsecure.com)
- Advanced analytics per company
- White-label themes
- API for customers

### Phase 5: Enterprise SaaS (Weeks 21-26)

- Database-level tenancy
- SSO/SAML
- Advanced compliance features
- Dedicated infrastructure option

---

## Company Portal Features

### Company Admin Dashboard

```
Dashboard Overview:
├── Quick Stats
│   ├── Total Students
│   ├── Active Assessments
│   ├── Team Health Score
│   ├── Billing Status
│
├── Campus Management
│   ├── Add/Edit/Delete Campuses
│   ├── Campus Admin Assignment
│   ├── Student Quotas
│
├── User Management
│   ├── Company Admins
│   ├── Campus Admins
│   ├── Mentors
│   ├── SSO Configuration (Enterprise)
│
├── Assessment Management
│   ├── Assessment Templates
│   ├── Workflows
│   ├── Question Bank (Company-specific)
│
├── Analytics & Reports
│   ├── Company-wide Analytics
│   ├── Campus Comparisons
│   ├── Skill Distribution
│   ├── Export Reports
│
├── Billing & Usage
│   ├── Current Plan
│   ├── Usage Metrics
│   ├── Upgrade/Downgrade
│   ├── Payment History
│   ├── Overage Charges
│
├── Integrations
│   ├── HR System Integration
│   ├── Slack Notifications
│   ├── API Keys Management
│
├── Settings
│   ├── Company Profile
│   ├── Email Configuration
│   ├── Branding (Enterprise)
│   ├── Security Settings
│   ├── Data Export/Deletion
```

---

## File Structure: SaaS Architecture

```
client/src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── CompanySignupPage.tsx (new)
│   │
│   ├── company/
│   │   ├── CompanyDashboard.tsx (new)
│   │   ├── CompanySettingsPage.tsx (new)
│   │   ├── BillingPage.tsx (new)
│   │   ├── UserManagementPage.tsx (new)
│   │   ├── IntegrationsPage.tsx (new)
│   │
│   ├── superadmin/ (stays the same, but company-aware)
│   │   ├── SuperAdminLayout.tsx (updated)
│   │   └── ...
│
├── hooks/
│   ├── useCompany.ts (new - get current company)
│   ├── useCompanyPlan.ts (new - check plan limits)
│   ├── useTenant.ts (new - tenant context)
│
├── services/
│   ├── companyService.ts (new)
│   ├── billingService.ts (new)
│   ├── tenantService.ts (new)
│
├── context/
│   ├── TenantContext.tsx (new - provide company_id globally)
│
├── utils/
│   ├── tenantUrl.ts (new - build tenant-aware URLs)
│   ├── apiClient.ts (updated - add company_id header)

server/src/
├── middleware/
│   ├── tenantMiddleware.ts (new - validate company_id)
│   ├── featureGate.ts (new - check plan features)
│   ├── rateLimit.ts (updated - per-company rate limits)
│
├── controllers/
│   ├── company.controller.ts (new)
│   ├── billing.controller.ts (new)
│   ├── subscription.controller.ts (new)
│   ├── tenant.controller.ts (new)
│   ├── superadmin.controller.ts (updated - company-aware)
│
├── routes/
│   ├── company.routes.ts (new)
│   ├── billing.routes.ts (new)
│   ├── tenant.routes.ts (new)
│
├── models/
│   ├── Company.ts (new)
│   ├── Subscription.ts (new)
│   ├── BillingEvent.ts (new)
│   ├── CollegeCampus.ts (updated from College)
│
├── services/
│   ├── tenantService.ts (new)
│   ├── subscriptionService.ts (new)
│   ├── billingService.ts (new - integrate with Stripe)
```

---

## API Changes for Multi-Tenancy

### Phase 3 API Routes

```
Authentication:
POST   /auth/signup                    - Create company account
POST   /auth/login                     - Login (returns JWT with company_id)
POST   /auth/refresh                   - Refresh token

Company Management:
GET    /api/company                    - Get current company details
PUT    /api/company                    - Update company settings
POST   /api/company/invite-user        - Invite user to company

Campus Management (was College):
GET    /api/company/campuses           - List campuses for company
POST   /api/company/campuses           - Create campus
GET    /api/company/campuses/:id       - Get campus
PUT    /api/company/campuses/:id       - Update campus
DELETE /api/company/campuses/:id       - Delete campus

Student Management:
GET    /api/company/students           - List students (all campuses)
POST   /api/company/students           - Add student
GET    /api/company/students/:id       - Get student
PUT    /api/company/students/:id       - Update student
DELETE /api/company/students/:id       - Delete student

Billing:
GET    /api/company/billing/plan       - Get current plan
GET    /api/company/billing/usage      - Get usage metrics
PUT    /api/company/billing/plan       - Upgrade/downgrade plan
GET    /api/company/billing/invoices   - Get invoices

Assessments (Company-specific):
GET    /api/company/assessments        - List assessments for company
POST   /api/company/assessments        - Create assessment
```

### JWT Example

```json
{
  "sub": "user-123",
  "company_id": "company-456",
  "company_slug": "acme-corp",
  "role": "company_admin",
  "campuses": ["campus-1", "campus-2"],
  "plan": "pro",
  "iat": 1688000000,
  "exp": 1688086400
}
```

---

## Security Considerations

### Tenant Isolation Security

```
✅ Must Implement:
- Verify company_id in JWT matches request
- Add company_id WHERE clause to all queries
- Hash company secrets (API keys)
- Audit logs for data access
- HTTPS only
- CORS whitelist per company (Enterprise)

❌ Don't Do:
- Trust frontend company_id parameter
- Assume company_id is validated elsewhere
- Allow company_id to be NULL
- Mix company data in responses
```

### Compliance Requirements

For Enterprise customers:
- [ ] SOC 2 Type II compliance
- [ ] GDPR data processing agreement
- [ ] Right to erasure (delete all company data)
- [ ] Data residency options
- [ ] Encrypted backup per company

---

## Competitive Analysis: SaaS Hiring Platforms

### Current Market

```
Competitors:
1. HackerRank - Enterprise coding assessments
   → Monetization: Per-assessment pricing + team licensing
   → Tenancy: Company + Division structure
   
2. CodeSignal - Technical skill assessment
   → Monetization: Tiered plans by team size
   → Tenancy: Company + Team structure
   
3. LinkedIn Learning - Skill development
   → Monetization: Enterprise subscriptions
   → Tenancy: Company-wide access

4. Coursera for Business - University partnerships
   → Monetization: Per-student + campus licensing
   → Tenancy: Campus + Department structure
```

### TalentSecure SaaS Differentiation

```
vs. HackerRank:
✅ Campus hiring focus (not just companies)
✅ Soft skills + Technical (they're coding-only)
✅ Lower price point for mid-market

vs. CodeSignal:
✅ Assessment + LMS (they're assessment-only)
✅ Mentor network (they don't have this)
✅ Better mobile experience

vs. Coursera:
✅ Assessment-first (they're content-first)
✅ Real-time feedback (they're async)
✅ Lower latency (local deployment option)
```

---

## Go-to-Market Strategy for SaaS

### Phase 3 Target Customers

1. **Mid-Market Companies** (500-5000 employees)
   - HR departments doing bulk hiring
   - Need assessment platform + training
   - Budget: $5-20k/year
   - Timeline: 2-3 month sales cycle

2. **Educational Institutions**
   - Universities wanting student skill tracking
   - Campus hiring coordination
   - Student placement improvement
   - Budget: $2-10k/year per campus

3. **Skill Development Platforms**
   - Bootcamps, online courses
   - Need assessment + placement tracking
   - Existing customer base for upsell
   - Budget: $5-15k/year

### Sales Strategy

```
Starter Plan: Self-service (stripe.com checkout)
Pro Plan: Inbound sales + demo
Enterprise Plan: Account executive + custom pricing

Target: 100 companies in Year 1, 500 in Year 2
ARR Target: $300k Year 1, $2M Year 2
```

---

## Implementation Checklist: Phase 3

### Database
- [ ] Add company/subscription/billing tables
- [ ] Add company_id to all tables
- [ ] Create migration scripts
- [ ] Test data isolation

### Backend
- [ ] Implement tenant middleware
- [ ] Update all controllers to use company_id
- [ ] Create company API endpoints
- [ ] Implement Stripe integration for billing
- [ ] Add feature gates (per-plan restrictions)
- [ ] Write comprehensive tests for data isolation

### Frontend
- [ ] Create company signup flow
- [ ] Build company admin dashboard
- [ ] Update routing for multi-tenancy
- [ ] Create billing management UI
- [ ] Update all pages to be company-aware

### DevOps
- [ ] Database migration strategy
- [ ] Backup isolation per company
- [ ] Monitoring for data leaks
- [ ] Load testing for multi-tenant load

### Compliance
- [ ] Terms of service update (SaaS terms)
- [ ] Privacy policy update (data handling)
- [ ] Security audit for multi-tenancy
- [ ] GDPR compliance check

---

## Financial Projections

### Year 1 SaaS Model

```
Starter (100 companies × $99/month):
  = $118,800/year ARR

Pro (80 companies × $299/month):
  = $287,520/year ARR

Enterprise (5 companies × $2000/month):
  = $120,000/year ARR

Total Year 1 ARR: $526,320
```

### Cost Structure

```
Infrastructure:
  - Database/hosting: $2,000/month
  - CDN/networking: $500/month
  - Monitoring/logging: $300/month
  Total: $32,400/year

Development:
  - Engineering: $200,000/year (2 engineers)
  - Product: $80,000/year
  - QA: $60,000/year
  Total: $340,000/year

Operations:
  - Support: $50,000/year
  - Marketing: $40,000/year
  - Legal/Compliance: $20,000/year
  Total: $110,000/year

Total Annual Cost: $482,400
Gross Margin Year 1: $43,920 (8%)
```

### Break-Even Analysis

```
Break-even at ~150-200 customers (mix of plans)
Timeline: 12-18 months after Phase 3 launch

Profitability threshold:
- Starter: 150 customers
- Pro: 50 customers
- Enterprise: 3 customers
OR
- Pro: 80 customers
- Enterprise: 2 customers
```

---

## Success Metrics

### Product Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate (target: < 5%/month)
- Net Revenue Retention (target: > 120%)

### Adoption Metrics
- Time to first assessment (target: < 24 hours)
- Days to 10 active students (target: < 7 days)
- Feature adoption rate by plan

### Satisfaction Metrics
- NPS Score (target: > 50)
- Customer satisfaction (CSAT > 90%)
- Support resolution time (target: < 4 hours)

---

## Summary: Long-Term Vision

### Timeline

```
Now - Phase 1-2:        Single-tenant, Colleges
Months 1-3:             Phase 3 - Multi-tenant Row-Level
Months 4-6:             Phase 4 - Schema-Level Tenancy
Months 7-12:            Phase 5 - Database-Level Tenancy + Enterprise

Target: Full SaaS platform by Month 12
```

### Investment Required

- Development: 6-8 engineers for 12 months
- DevOps: 1-2 engineers for infrastructure
- Product/Design: 1 product manager, 1 designer
- Sales/Marketing: 1-2 people for go-to-market
- Operations: 1 customer success manager

Total: ~$1.2M investment for 12 months

### Expected Outcome

- **Year 1**: 150-200 customers, $500k+ ARR
- **Year 2**: 500+ customers, $2M+ ARR
- **Year 3**: 1000+ customers, $5M+ ARR
- **Valuation**: $15-30M (at 3-6x ARR multiple)

---

## Next Steps

1. **Review** this SaaS vision with stakeholders
2. **Decide**: Multi-tenancy approach (Row-Level / Schema-Level / Database-Level)
3. **Plan**: Phase 3 detailed sprint breakdown
4. **Start**: Company/Subscription management (Day 1)
5. **Iterate**: Get early customer feedback on company portal

---

**Document Generated**: 2026-07-04  
**Target Audience**: Product, Engineering, Investors  
**Status**: Ready for strategic review and Phase 3 planning
