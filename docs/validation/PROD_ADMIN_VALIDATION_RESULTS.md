# Production Admin Portal - Validation Results

**Target:** https://gradlogic.atherasys.com  
**API:** https://api.gradlogic.atherasys.com/api  
**Account:** `admin@gradlogic.com` / `gradlogic123`  
**Date:** 2026-07-24  
**Mode:** Read-only (no mutations against production)  
**Runner:** `client/tests/e2e/superadmin/prod-validate-modules.spec.ts`  
**Screenshots:** [artifacts/prod-admin-validation-2026-07-24/](./artifacts/prod-admin-validation-2026-07-24/)

## Verdict

**Admin modules are functionally reachable and authenticated correctly on production.**  
**48 scenario checks: 48 PASS / 0 FAIL** (after timing fixes on colleges/users waits).

Mutating CRUD scenarios were intentionally not executed against production.

## Summary

| Area | Result |
|------|--------|
| Auth (login / logout / negatives / deep-link) | PASS |
| RBAC (HR blocked from Super Admin) | PASS |
| API auth (401 without JWT; admin GETs 200) | PASS |
| Navigation smoke (25 module routes) | PASS |
| Colleges list + data | PASS (ZZ TEST VALIDATION College visible) |
| Users roster | PASS (7 total) |
| Question Bank / Collections / Drives / Assessment Hub | PASS |
| Roles + Permission Matrix | PASS (matrix controls visible after settle) |
| Analytics / Notifications / Billing / AI Config / Settings / Audit | PASS |

## Auth & security

| ID | Scenario | Status | Notes |
|----|----------|--------|-------|
| AUTH-01 | UI login lands on Super Admin dashboard | PASS | `/app/superadmin/dashboard` |
| AUTH-02 | Logout returns to login and clears session | PASS | `sessionStorage.accessToken` cleared |
| AUTH-04 | Wrong password shows clear error | PASS | Stayed on `/auth/login` |
| AUTH-05 | Empty email/password blocked | PASS | Validation prevented submit |
| AUTH-06 | Non-super-admin blocked from Super Admin | PASS | HR ? `/not-authorized` |
| AUTH-07 | Unauthed deep-link redirects to login | PASS | `/app/superadmin/users` ? login |
| SEC-01 | Unauthenticated API rejected | PASS | `GET /superadmin/colleges` ? 401 |

## Module navigation smoke

All of the following loaded inside the GradLogic Admin Console shell (no login bounce, no crash/404):

| ID | Route | Status |
|----|-------|--------|
| NAV-dashboard | `/app/superadmin/dashboard` | PASS |
| NAV-colleges | `/app/superadmin/colleges` | PASS |
| NAV-colleges-new | `/app/superadmin/colleges/new` | PASS |
| NAV-colleges-req | `/app/superadmin/colleges/requests` | PASS |
| NAV-students | `/app/superadmin/students` | PASS |
| NAV-approvals | `/app/superadmin/approvals` | PASS |
| NAV-modules | `/app/superadmin/modules` | PASS |
| NAV-users | `/app/superadmin/users` | PASS |
| NAV-roles | `/app/superadmin/roles` | PASS |
| NAV-roles-matrix | `/app/superadmin/roles/matrix` | PASS |
| NAV-qb | `/app/superadmin/question-bank` | PASS |
| NAV-qb-ai | `/app/superadmin/question-bank/ai-generator` | PASS |
| NAV-qb-categories | `/app/superadmin/question-bank/categories` | PASS |
| NAV-qb-review | `/app/superadmin/question-bank/review-queue` | PASS |
| NAV-qb-import | `/app/superadmin/question-bank/import-books` | PASS |
| NAV-workflows | `/app/superadmin/workflows` | PASS |
| NAV-analytics | `/app/superadmin/analytics` | PASS |
| NAV-notifications | `/app/superadmin/notifications` | PASS |
| NAV-billing | `/app/superadmin/billing` | PASS |
| NAV-ai-config | `/app/superadmin/ai-config` | PASS |
| NAV-settings | `/app/superadmin/settings` | PASS |
| NAV-audit | `/app/superadmin/audit-trail` | PASS |
| NAV-collections | `/app/superadmin/question-collections` | PASS |
| NAV-drives | `/app/superadmin/drives` | PASS |
| NAV-assessment-hub | `/app/superadmin/assessment-hub` | PASS |

## Functional read checks

| ID | Scenario | Status | Notes |
|----|----------|--------|-------|
| COLL-01 | Colleges list shows data | PASS | ZZ TEST VALIDATION College (Bangalore, Active, 1 student) |
| USR-01 | Users roster loads | PASS | Manage platform users (**7 total**) |
| QB-01 | Platform question bank page | PASS | UI OK; API `GET /question-bank` returned **41** questions |
| DRV-01 | Assessment Builder (drives) | PASS | UI OK; API reported **0** drives |
| ROL-07 | Permission matrix renders | PASS | Matrix controls visible after ~10s settle |

## API smoke (admin bearer token)

| ID | Endpoint | Status |
|----|----------|--------|
| API-COLL | `GET /superadmin/colleges` | PASS 200 |
| API-STU | `GET /superadmin/students` | PASS 200 |
| API-USR | `GET /superadmin/users` | PASS 200 |
| API-ROL | `GET /superadmin/roles` | PASS 200 |
| API-MOD | `GET /superadmin/modules` | PASS 200 |
| API-SET | `GET /superadmin/settings` | PASS 200 |
| API-AUD | `GET /superadmin/audit-trail` | PASS 200 |
| API-WF | `GET /superadmin/workflows` | PASS 200 |
| API-QB | `GET /question-bank` | PASS 200 |
| API-QC | `GET /question-collections` | PASS 200 |
| API-DRV | `GET /drives` | PASS 200 |

## Findings (non-blocking for read-only admin module UAT)

1. **CSP blocks Google Fonts** - production `style-src 'self' 'unsafe-inline'` rejects `fonts.googleapis.com`. Pages still render; browser console logs CSP errors. Legacy e2e treated these as failures until filtered.
2. **Login field is not `type=email`** - label is "Email or Student ID" (`type=text`). Older suite selectors timed out on UI login.
3. **Sidebar IA** - hubs are Organization / Learning Hub / Assessment Hub / Administration (not Overview / Manage / System).
4. **Permission Matrix is slow** - fans out per-role detail fetches; needs several seconds to leave the spinner. Also `GET /api/superadmin/roles/matrix` is a bad path (treats `matrix` as UUID ? 500). Real catalog is `GET /api/superadmin/roles/permissions`.
5. **Dashboard KPIs can show zeros** while Colleges/Users still have live rows (metric aggregation lag or separate counters).
6. **Assessment Builder has 0 drives** on this environment - Path A publish loop not exercised here.
7. **Mutations not run** - create/update/delete/soft-delete scenarios require a throwaway DB (`ADMIN_ALLOW_MUTATIONS=1` locally only).

## How to re-run

```bash
cd client
BASE_URL=https://gradlogic.atherasys.com \
API_URL=https://api.gradlogic.atherasys.com/api \
ADMIN_EMAIL=admin@gradlogic.com \
ADMIN_PASSWORD=gradlogic123 \
npx playwright test tests/e2e/superadmin/prod-validate-modules.spec.ts \
  --project=superadmin --workers=1 --timeout=180000
```

Scenario catalog: [ADMIN_PORTAL_VALIDATION_SCENARIOS.md](./ADMIN_PORTAL_VALIDATION_SCENARIOS.md)
