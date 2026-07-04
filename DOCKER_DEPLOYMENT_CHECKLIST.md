# Docker Deployment Checklist

Complete this checklist before deploying the updated SuperAdmin modules to production.

---

## ✅ Pre-Deployment (Local Testing)

### Code Compilation
- [ ] **TypeScript compiles without errors**
  ```bash
  cd client && npm run build
  cd ../server && npm run build
  ```
  Expected: No TS errors, dist/ folders populated

- [ ] **No TypeScript strict mode violations**
  ```bash
  npm run lint
  ```

- [ ] **Prisma schema is valid**
  ```bash
  npx prisma validate
  ```

### Database
- [ ] **Migrations are syntactically correct**
  ```bash
  # In psql or local DB:
  # Manually review both migration files for SQL syntax
  ```

- [ ] **No conflicting foreign keys**
  - colleges.approved_by → users.id ✅
  - subscriptions.college_id → colleges.id ✅
  - subscriptions.plan_id → subscription_plans.id ✅
  - All others follow same pattern

- [ ] **No naming conflicts**
  - Table names: unique ✅
  - Column names: no duplicates within tables ✅
  - Index names: unique ✅

### Route Integration
- [ ] **billing.routes imported in app.ts**
  ```bash
  grep -c "billingRoutes" server/src/app.ts
  # Should return 1 for import + 1 for app.use
  ```

- [ ] **All routes mounted at correct paths**
  ```bash
  grep "app.use.*billing\|app.use.*campus\|app.use.*question" server/src/app.ts
  ```

### Client Routes
- [ ] **All lazy imports resolve**
  ```bash
  cd client/src
  grep -E "QuestionBankPage|BillingPage|PendingApprovalsPage" App.tsx
  # Should find 3 imports
  ```

- [ ] **App.tsx has no syntax errors**
  ```bash
  cd client && npx tsc --noEmit src/App.tsx
  ```

---

## 🐳 Docker Build & Start

### Step 1: Clean Build
```bash
# Stop containers
docker-compose down

# Remove old images (optional, for clean slate)
docker-compose down --rmi all

# Rebuild
docker-compose build

# Start
docker-compose up -d

# Wait for services to be healthy
sleep 10
docker-compose ps
# All services should show "healthy" or "Up"
```

### Step 2: Verify Database Connection
```bash
# Should connect without errors
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "SELECT version();"

# Verify new tables don't exist yet (pre-migration state)
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\dt subscription_plans"
# Should return "Did not find any relation"
```

### Step 3: Run Migrations
```bash
# Option A: Via Prisma CLI (if node installed in container)
docker exec talentsecure-server npx prisma migrate deploy

# Option B: Manual SQL execution
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db < prisma/migrations/20260703_college_approval/migration.sql
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db < prisma/migrations/20260703_billing_system/migration.sql
```

### Step 4: Verify Tables Created
```bash
# Check colleges has new columns
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\d+ colleges"
# Should show: approval_status, approved_by, approved_at, rejection_reason, rejection_at

# Check billing tables exist
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\dt subscription*"
# Should list: subscription_plans, subscriptions

docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\dt invoices"
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\dt billing_contacts"
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "\dt usage_metrics"
```

### Step 5: Check Server Logs
```bash
# Look for startup errors
docker logs talentsecure-server

# Should see:
# ✓ PostgreSQL connected
# ✓ Redis connected
# ✓ Socket.IO initialized
# ✓ GradLogic server running on port 5000
# No ERROR lines

# If NestJS errors about missing migrations, re-run Step 3
```

### Step 6: Seed Subscription Plans
```bash
# Insert default plans
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db << 'EOF'
INSERT INTO subscription_plans (id, name, description, tier, price_per_month, price_per_year, max_students, max_drives, max_assessments, features, is_active)
VALUES
  (uuid_generate_v4(), 'Free', 'Get started', 'free', 0, 0, 50, 3, 10, '{"proctoring":false,"ai_grading":false}'::jsonb, true),
  (uuid_generate_v4(), 'Starter', 'Small colleges', 'starter', 5000, 50000, 500, 10, 100, '{"proctoring":true,"ai_grading":false}'::jsonb, true),
  (uuid_generate_v4(), 'Professional', 'Growing institutions', 'professional', 15000, 150000, 2000, 50, 500, '{"proctoring":true,"ai_grading":true}'::jsonb, true),
  (uuid_generate_v4(), 'Enterprise', 'Custom solutions', 'enterprise', 50000, 500000, NULL, NULL, NULL, '{"proctoring":true,"ai_grading":true,"sso":true}'::jsonb, true)
ON CONFLICT (tier) DO NOTHING;
EOF

# Verify
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "SELECT tier, price_per_month FROM subscription_plans;"
# Should list 4 plans
```

---

## 🧪 Functional Testing

### Question Bank Module
```bash
# Get auth token first
export JWT=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword1"}' | jq -r '.data.accessToken')

# List questions (should be empty or return existing ones)
curl -X GET "http://localhost:5000/api/question-bank" \
  -H "Authorization: Bearer $JWT" | jq .

# Create a question
curl -X POST "http://localhost:5000/api/question-bank" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "programming",
    "type": "multiple_choice",
    "difficulty_level": "easy",
    "question_text": "What is 2+2?",
    "options": ["3", "4", "5"],
    "correct_answer": "4",
    "marks": 5
  }' | jq .
```

### College Approval Module
```bash
# List pending colleges
curl -X GET "http://localhost:5000/api/campuses/approval/pending" \
  -H "Authorization: Bearer $JWT" | jq .

# Approve a college (replace COLLEGE_ID with real ID)
curl -X POST "http://localhost:5000/api/campuses/{COLLEGE_ID}/approve" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Verified credentials"}' | jq .

# Reject a college
curl -X POST "http://localhost:5000/api/campuses/{COLLEGE_ID}/reject" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason":"Insufficient documentation provided"}' | jq .
```

### Billing Module
```bash
# List plans (public - no auth needed)
curl -X GET "http://localhost:5000/api/billing/plans" | jq .

# Get current subscription (college_admin)
curl -X GET "http://localhost:5000/api/billing/subscriptions" \
  -H "Authorization: Bearer $JWT" | jq .

# Subscribe to a plan
PLAN_ID=$(curl -s -X GET "http://localhost:5000/api/billing/plans" | jq -r '.data[0].id')
curl -X POST "http://localhost:5000/api/billing/subscribe" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"plan_id\":\"$PLAN_ID\",\"billing_cycle\":\"monthly\"}" | jq .

# List invoices
curl -X GET "http://localhost:5000/api/billing/invoices" \
  -H "Authorization: Bearer $JWT" | jq .

# Add billing contact
curl -X POST "http://localhost:5000/api/billing/contacts" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance Manager",
    "email": "finance@college.edu",
    "phone": "+91-9999999999",
    "designation": "CFO",
    "city": "Bangalore",
    "gst_number": "27AABCT1234F1Z5",
    "is_primary": true
  }' | jq .
```

### Client-Side Testing
1. **Open browser to http://localhost:5173** (or client port)
2. **Log in as super_admin or hr**
   - Navigate to "Question Bank" nav item
   - Should load question list or "No questions" message
   - Try creating a question

3. **Navigate to "Pending Approvals"**
   - Should list any pending colleges (or empty if none)
   - Try approving/rejecting if test data exists

4. **Log in as college_admin**
   - Navigate to "Billing"
   - Should show "No Active Subscription" or current subscription
   - Switch to "Plans" tab
   - Try selecting a plan (should show modal)

---

## 🔍 Database Verification

### Check All Migrations Applied
```bash
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
SELECT id, checksum, finished_at
FROM _prisma_migrations
WHERE name LIKE '%college_approval%' OR name LIKE '%billing%'
ORDER BY finished_at DESC;
"
# Should show exactly 2 rows if both migrations applied
```

### Verify Foreign Keys
```bash
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('colleges', 'subscriptions', 'invoices', 'billing_contacts')
ORDER BY table_name;
"
```

### Check Indexes
```bash
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('subscription_plans', 'subscriptions', 'invoices', 'billing_contacts', 'usage_metrics')
ORDER BY tablename;
"
```

---

## 📊 Performance Checks

### Query Performance (Test Indexes)
```bash
# Explain plan for common queries
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
EXPLAIN ANALYZE
SELECT * FROM colleges WHERE approval_status = 'pending' LIMIT 20;
"
# Should use idx_colleges_pending index

docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
EXPLAIN ANALYZE
SELECT * FROM subscriptions WHERE college_id = 'some-uuid' AND status = 'active';
"
# Should use idx_subscriptions_college_id and idx_subscriptions_status
```

### Table Sizes
```bash
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db -c "
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('colleges', 'subscription_plans', 'subscriptions', 'invoices', 'billing_contacts', 'usage_metrics')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## 🚨 Rollback Plan

If anything fails:

### Option 1: Rollback Migrations
```bash
# Rollback billing system
npx prisma migrate resolve --rolled-back 20260703_billing_system

# Rollback college approval
npx prisma migrate resolve --rolled-back 20260703_college_approval

# Regenerate client
npx prisma generate
```

### Option 2: Restore from Backup
```bash
# If you have pg_dump backup
docker exec talentsecure-db pg_restore -U talentsecure -d talentsecure_db /path/to/backup.sql
```

### Option 3: Manual SQL Rollback
```bash
docker exec talentsecure-db psql -U talentsecure -d talentsecure_db << 'EOF'
-- Drop billing tables (reverse order of creation)
DROP TABLE IF EXISTS usage_metrics CASCADE;
DROP TABLE IF EXISTS billing_contacts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Drop approval columns from colleges
ALTER TABLE colleges
DROP COLUMN IF EXISTS approval_status,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS rejection_at;

-- Drop foreign key if exists
ALTER TABLE colleges
DROP CONSTRAINT IF EXISTS fk_colleges_approved_by;
EOF
```

---

## ✅ Final Sign-Off

- [ ] All TypeScript code compiles
- [ ] Database migrations run without errors
- [ ] All 6 new tables created in DB
- [ ] All 3 new routes accessible and return 200 OK
- [ ] Client pages load without JavaScript errors (browser console clean)
- [ ] Question Bank page displays
- [ ] Pending Approvals page displays
- [ ] Billing page displays
- [ ] All navigation items appear for correct roles
- [ ] Create/Read/Update operations work (tested via curl)
- [ ] Docker logs show no ERROR level messages
- [ ] Subscription plans seeded (4 default plans exist in DB)
- [ ] No TypeScript strict mode violations remain

**Deployment Ready**: ✅ Yes / ❌ No

**Date**: _____________________
**Approved By**: _____________________

---

## 📞 Support

If deployment fails:
1. Check `SUPERADMIN_COMPLETION.md` for detailed implementation docs
2. Verify all file paths and migrations exist
3. Review server logs: `docker logs talentsecure-server`
4. Review database logs: `docker logs talentsecure-db`
5. Check client console (F12) for JavaScript errors
