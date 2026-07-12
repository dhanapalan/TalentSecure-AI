# SuperAdmin Portal — Automated Validation Suite

Playwright E2E suite that validates every SuperAdmin (Admin) portal workflow in
[`ADMIN_PORTAL_TEST_HANDOVER.md`](../../../../ADMIN_PORTAL_TEST_HANDOVER.md).
84 tests across 16 spec files, one file per handover module (§5.A–O + §6).

## Layout

| File | Handover § | Covers |
|------|-----------|--------|
| `01-auth-access.spec.ts` | §5.A | Login, logout, refresh, non-admin block, route guards, API 401 |
| `02-navigation-smoke.spec.ts` | §5.A#4 | Every route loads inside the shell, no console errors |
| `03-colleges.spec.ts` | §5.C | List, search, filters, create form + validation, XSS* |
| `04-students.spec.ts` | §5.D | Roster, search, detail navigation |
| `05-approvals.spec.ts` | §5.E | Queue / empty state |
| `06-users.spec.ts` | §5.F | List, search, invite form + validation, create* |
| `07-roles.spec.ts` | §5.G | Roles list, create modal, system-role protection, matrix |
| `08-question-bank.spec.ts` | §5.H | All 5 sub-pages, search, review queue, AI generator |
| `09-workflows.spec.ts` | §5.I | Aptitude / Soft Skills / Technical category views |
| `10-analytics.spec.ts` | §5.J | Overview / colleges / reports, rapid switching |
| `11-notifications.spec.ts` | §5.K | Tabs, announcement validation, create*, XSS* |
| `12-billing.spec.ts` | §5.L | Plans / subscriptions / invoices / empty state |
| `13-ai-config.spec.ts` | §5.M | All 5 tabs |
| `14-modules.spec.ts` | §5.N | Module management, toggles |
| `15-settings-audit.spec.ts` | §5.O | Settings, backup tab, audit trail + filters |
| `16-cross-cutting.spec.ts` | §6 | API security (401/403), responsive 375/768/1920, console health |

`*` = mutating flow, **skipped by default** (see below).

## Running

```bash
cd client

# Local dev (default: BASE_URL=http://localhost:5173, API=http://localhost:5050/api)
# Requires the server + client running with a seeded super-admin.
npm run test:superadmin

# Watch/debug UI
npm run test:superadmin:ui

# Production QA environment (from the handover)
BASE_URL=https://gradlogic.atherasys.com \
API_URL=https://api.gradlogic.atherasys.com/api \
npm run test:superadmin

# HTML report
npm run test:e2e:report
```

When `BASE_URL` is a remote host the local dev server is **not** started
(the app is assumed deployed).

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `BASE_URL` | `http://localhost:5173` | Frontend origin under test |
| `API_URL` | `http://localhost:5050/api` | API base (include `/api`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@gradlogic.com` / `gradlogic123` | Super-admin login |
| `NONADMIN_EMAIL` / `NONADMIN_PASSWORD` | `hr@gradlogic.com` / `gradlogic123` | Access-control check |
| `ADMIN_ALLOW_MUTATIONS` | _unset_ | `1` enables create/XSS/duplicate flows |

> Local dev seeds may use different passwords than the production handover
> (e.g. `admin123`). Override with `ADMIN_PASSWORD=…` if login fails.

## Safety: read-only by default

Tests that **write** to the database (create college / invite user / create
role / create announcement, plus the XSS-persistence probes) are guarded by
`test.skip(!ALLOW_MUTATIONS)`. A default run is non-destructive: page loads,
searches, client-side validation, and read-only API checks only. Enable
mutations **only against a throwaway/local database**:

```bash
ADMIN_ALLOW_MUTATIONS=1 npm run test:superadmin
```

Mutating tests use timestamped unique names to avoid collisions.

## How authentication works

The portal keeps its session in **`sessionStorage`** (`accessToken`,
`refreshToken`, `user`, `permissions`) and `super_admin` bypasses every
`PermissionGuard`. The suite logs in once via the real `/auth/login` API and
seeds `sessionStorage` with an init script that runs before the app boots
(`helpers/admin-session.ts`). This is why module tests are fast and don't
re-drive the login form each time — only `01-auth-access.spec.ts` exercises the
real login UI.

> Note: this differs from the older `tests/e2e/helpers/auth.ts`, which writes
> `localStorage` — that helper predates the sessionStorage migration and does
> not authenticate the current SuperAdmin portal.
