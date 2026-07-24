# Admin Portal — Validation Scenarios

Executable QA scenarios for the **Super Admin** portal (`/app/superadmin`) and the admin-facing parts of the **College Admin** portal (`/app/college-portal`).

Aligned with:

- Routes: `client/src/App.tsx`, `SuperAdminLayout`, `CollegeLayout`
- Wave 1 plan: [README.md](./README.md)
- Existing automation: `client/tests/e2e/superadmin/`, `client/tests/e2e/sprint-1a/`
- Historical handover: [`ADMIN_PORTAL_TEST_HANDOVER.md`](../../ADMIN_PORTAL_TEST_HANDOVER.md)

---

## How to use

| Priority | Meaning |
|----------|---------|
| **P0** | Release / UAT blocker — must pass |
| **P1** | Core admin capability — should pass before pilot |
| **P2** | Extended / soft modules — page loads; deep CRUD optional |

Mark each scenario **Pass / Fail / Blocked / N/A** and note environment (local / staging / prod).

### Environment

| Item | Local default |
|------|----------------|
| Login | `/auth/login` (**not** `/login`) |
| Super Admin home | `/app/superadmin/dashboard` |
| College Admin home | `/app/college-portal/dashboard` |
| Client | `http://localhost:5173` (or `http://admin.localhost:5173`) |
| API | `http://localhost:5050` |
| Infra | Postgres + Redis + MinIO via Docker Compose |

### Credentials (Docker seed)

| Actor | Email | Password |
|-------|-------|----------|
| Super Admin | `admin@gradlogic.com` | `gradlogic123` |
| HR (negative RBAC) | `hr@gradlogic.com` | `gradlogic123` |
| Engineer (negative RBAC) | `engineer@gradlogic.com` | `gradlogic123` |
| CXO (negative RBAC) | `cto@gradlogic.com` | `gradlogic123` |

College Admin (`college@gradlogic.com`) is typically created via college onboarding, not the base schema seed. Override passwords with `ADMIN_PASSWORD` / suite env vars if your environment differs.

> Prefer Docker init-db password `gradlogic123`. Stale docs that list `Admin123` / `admin123` may not match a fresh volume.

### Automation shortcuts

```bash
# Super Admin module suite (read-only by default)
cd client && npm run test:superadmin

# Include mutating CRUD (throwaway DB only)
ADMIN_ALLOW_MUTATIONS=1 npm run test:superadmin

# College onboarding + Path A
npm run test:sprint1a
```

---

## Dual assessment pipelines (do not mix)

| Path | Owner | Question store | Admin surfaces | Student surface |
|------|-------|----------------|----------------|-----------------|
| **A — Platform** | Super Admin | `question_bank` | QB → Collections → Drives → Assign campus | `/tests`, `/exam/:driveId/*` |
| **B — Campus** | College Admin | `college_questions` | Campus QB → Assessments → Campaigns | `/my-assessments` |

Assigning a platform drive does **not** copy questions into the campus bank. College reviews Path A under **Campus Drives**.

---

## Scenario index

| ID | Area | Priority | Automation |
|----|------|----------|------------|
| AUTH-* | Auth & access | P0 | `01-auth-access.spec.ts` |
| NAV-* | Navigation smoke | P0 | `02-navigation-smoke.spec.ts` |
| DASH-* | Dashboard | P1 | navigation / sprint1a flow-01 |
| COLL-* | Colleges | P0 | `03-colleges.spec.ts`, flow-02/03 |
| ONB-* | College onboarding E2E | P0 | sprint1a flow-01…09 |
| STU-* | Global students | P1 | `04-students.spec.ts` |
| APR-* | Approvals | P1 | `05-approvals.spec.ts` |
| USR-* | Users | P0 | `06-users.spec.ts` |
| ROL-* | Roles & permissions | P0 | `07-roles.spec.ts` |
| QB-* | Platform question bank | P0 | `08-question-bank.spec.ts` |
| QC-* | Question collections | P0 | Path A specs |
| DRV-* | Assessment Builder (drives) | P0 | Path A / WF-PATH-A |
| PATHA-* | Path A end-to-end | P0 | flow-15 / WF-PATH-A |
| PATHB-* | Path B (college) | P1 | WF-PATH-B |
| CAMP-* | College portal admin | P0/P1 | sprint1a + campus specs |
| WF-* | Workflows | P2 | `09-workflows.spec.ts` |
| AN-* | Analytics | P1 | `10-analytics.spec.ts` |
| NTF-* | Notifications | P1 | `11-notifications.spec.ts` |
| BILL-* | Billing | P1 | `12-billing.spec.ts` |
| AI-* | AI configuration | P0 (SPOFs) | `13-ai-config.spec.ts` |
| MOD-* | Modules | P1 | `14-modules.spec.ts` |
| SET-* | Settings & audit | P1 | `15-settings-audit.spec.ts` |
| SEC-* | Security / RBAC / IDOR | P0 | `16-cross-cutting`, WAVE1_RBAC |
| LH-* | Learning Hub soft pages | P2 | menu smoke |
| CRUD-* | CRUD + soft-delete | P1 | `17-crud-soft-delete.spec.ts` |

---

## 1. Authentication & access (AUTH)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| AUTH-01 | P0 | Open `/auth/login`, sign in as Super Admin | Redirect to `/app/superadmin/dashboard`; tokens in `sessionStorage` |
| AUTH-02 | P0 | Logout from Super Admin shell | Back on login; browser Back does not restore admin session |
| AUTH-03 | P0 | Refresh while logged in | Session persists; dashboard still loads |
| AUTH-04 | P0 | Wrong password | Clear error; stay on login; no crash |
| AUTH-05 | P0 | Empty email and/or password | Client validation; submit blocked |
| AUTH-06 | P0 | Login as `hr@gradlogic.com`, open `/app/superadmin/users` | Denied (`/not-authorized` or redirect away from Super Admin) |
| AUTH-07 | P0 | Open `/app/superadmin/dashboard` with no session | Redirect to `/auth/login` |
| AUTH-08 | P1 | Clear `sessionStorage` mid-session, navigate | Redirect to login |
| AUTH-09 | P1 | User with `must_change_password` | Forced to `/auth/setup-password` before portal |
| AUTH-10 | P1 | Login on `admin.*` vs `campus.*` host (if subdomain routing enabled) | Correct portal tab / home redirect for role |

---

## 2. Navigation smoke (NAV)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| NAV-01 | P0 | From dashboard, open each **hard** sidebar hub item (Organization, Assessment Hub core, Administration) | Page renders inside Super Admin shell; no blank/error boundary |
| NAV-02 | P1 | Open each **soft** Learning Hub / AI Studio / Voice Studio leaf | Page loads without crash (empty/coming-soon OK) |
| NAV-03 | P1 | Rapidly switch between Analytics sub-views | No crash; last view usable |
| NAV-04 | P2 | Viewport 375 / 768 / 1920 | Shell usable; primary actions reachable |

**Hard routes (must load):**

- `/app/superadmin/dashboard`
- `/app/superadmin/colleges`, `/colleges/new`, `/colleges/requests`
- `/app/superadmin/students`
- `/app/superadmin/users`, `/roles`, `/roles/matrix`
- `/app/superadmin/question-bank` (+ categories, review-queue)
- `/app/superadmin/question-collections`
- `/app/superadmin/drives`
- `/app/superadmin/ai-config`
- `/app/superadmin/settings`, `/audit-trail`
- `/app/superadmin/notifications`, `/billing`, `/modules`, `/analytics`

---

## 3. Dashboard (DASH)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| DASH-01 | P1 | Load `/app/superadmin/dashboard` | KPI/cards render; no console errors on happy path |
| DASH-02 | P2 | Compare KPI counts to seeded data (colleges/users/students) | Counts plausible / non-NaN |

---

## 4. Colleges (COLL)

Routes: `/app/superadmin/colleges`, `/colleges/new`, `/colleges/:id`, `/colleges/requests`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| COLL-01 | P0 | List colleges | Table/grid loads; pagination if many rows |
| COLL-02 | P0 | Search / filter by name or status | Results update correctly |
| COLL-03 | P0 | Create college with valid required fields | Success; appears in list; detail reachable |
| COLL-04 | P0 | Submit create with empty name | Blocked with validation message |
| COLL-05 | P0 | Invalid email (`notanemail`) | Rejected |
| COLL-06 | P0 | Duplicate college email (sequential) | Clear 409/“already exists” style error |
| COLL-07 | P1 | Suspend then activate college | Status flips; college portal access follows policy |
| COLL-08 | P1 | View college requests queue | Pending requests listed or empty state |
| COLL-09 | P1 | Approve / reject a college request (if data available) | Status updates; audit/notification if configured |
| COLL-10 | P1 | Indian phone `+91 9876543210` | Accepted (or documented format rule enforced) |
| COLL-11 | P1 | XSS payload in college name | Escaped; no script execution |
| COLL-12 | P0 | Generate / reveal TPO (college admin) credentials | Username + temp password shown/copyable |
| COLL-13 | P1 | Concurrent duplicate-email creates (API race) | Only one 201; others 409 — **known gap if no unique email constraint** |

---

## 5. College onboarding E2E (ONB) — P0 workflow

Full journey (see [WF-COLLEGE-ONBOARDING.md](./03_Workflow_Validation/WF-COLLEGE-ONBOARDING.md)):

```
SA login → Create college → TPO credentials
  → College Admin login → forced password change → campus dashboard
  → Register student → Student login → password/onboarding → student dashboard
```

| ID | Priority | Gate | Expected |
|----|----------|------|----------|
| ONB-01 | P0 | SA login + dashboard | Auth works |
| ONB-02 | P0 | College CRUD create/edit/suspend/activate | Status lifecycle works |
| ONB-03 | P0 | TPO credentials UI | Creds usable for first login |
| ONB-04 | P0 | College forced password → dashboard | Lands on `/app/college-portal/dashboard` |
| ONB-05 | P1 | Campus dashboard KPIs | Charts/widgets load |
| ONB-06 | P0 | Register student; visible in grid | Student row present |
| ONB-07 | P0 | Student login + password setup | Student portal reachable |
| ONB-08 | P1 | Onboarding wizard | Completes or resume-skip OK |
| ONB-09 | P1 | Student dashboard widgets | Progress/assessments area loads |

---

## 6. Global students (STU)

Route: `/app/superadmin/students`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| STU-01 | P1 | Open students list | Cross-college roster loads |
| STU-02 | P1 | Search by name/email | Filtered results |
| STU-03 | P1 | Open student detail | Detail page loads with college context |
| STU-04 | P2 | Filter by college | Only that college’s students |

---

## 7. Approvals (APR)

Route: `/app/superadmin/approvals`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| APR-01 | P1 | Open approvals | Queue or empty state |
| APR-02 | P2 | Act on a pending item (if present) | Status updates; requester side reflects change |

---

## 8. Users (USR)

Route: `/app/superadmin/users` (Faculty shortcut: `/users?role=instructor`)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| USR-01 | P0 | List users | Pagination / search works |
| USR-02 | P0 | Invite/create `college_admin` with required fields | Success; user listed |
| USR-03 | P0 | Submit invite missing required fields | Validation errors |
| USR-04 | P1 | Suspend / deactivate user | Cannot log in (or blocked by status) |
| USR-05 | P1 | Reactivate user | Login works again |
| USR-06 | P1 | Create `super_admin` invite (if allowed) | Succeeds only for authorized actor |
| USR-07 | P2 | Faculty filter `?role=instructor` | Instructors listed |

---

## 9. Roles & permission matrix (ROL)

Routes: `/app/superadmin/roles`, `/roles/matrix`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| ROL-01 | P0 | List roles | System + custom roles visible |
| ROL-02 | P0 | Create custom role with unique name | Appears in list |
| ROL-03 | P0 | Create role without name | Validation error |
| ROL-04 | P0 | Duplicate role name | Clean 409 / “already exists” |
| ROL-05 | P0 | Delete/deactivate system role | Blocked (403) |
| ROL-06 | P1 | Delete role with assigned users | Blocked or confirmation with clear message |
| ROL-07 | P0 | Open permission matrix | Matrix loads; toggles visible |
| ROL-08 | P1 | Change a non–super-admin role permission; login as that role | Access matches matrix (`super_admin` bypasses all guards) |

---

## 10. Platform Question Bank (QB)

Routes under `/app/superadmin/question-bank` (browse, ai-generator, categories, review-queue, import-books)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| QB-01 | P0 | Browse published/active questions | Rows from platform `question_bank` |
| QB-02 | P0 | Search / filter (category, difficulty, type) | Results update |
| QB-03 | P1 | Open AI Question Generator page | Form loads; empty prompt blocked |
| QB-04 | P1 | (If AI engine up) Generate questions | Items enter review/bank per design |
| QB-05 | P0 | Categories & topics list | Taxonomy loads |
| QB-06 | P1 | Create category | Success |
| QB-07 | P1 | Duplicate category name | Clean error (**not** HTTP 500 — known defect if 500) |
| QB-08 | P1 | Review queue: approve item | Moves to published/active |
| QB-09 | P2 | Import-from-books page load | Page loads; upload deep-test optional |
| QB-10 | P1 | Soft-deactivate question | Excluded from new collection fills |

---

## 11. Question Collections (QC)

Route: `/app/superadmin/question-collections`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| QC-01 | P0 | Create collection (valid name + category) | Collection created |
| QC-02 | P0 | Fill from bank | `question_count` ≥ 1 when bank has matches |
| QC-03 | P1 | Fill when category empty | Clear 400 / empty-state message |
| QC-04 | P1 | Open collection detail | Items listed; no duplicated bank content rows |

---

## 12. Assessment Builder — drives (DRV)

Routes: `/app/superadmin/drives`, `/drives/new`, `/drives/:id`, `/drives/:id/assign-campus`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| DRV-01 | P0 | List drives | Builder list loads |
| DRV-02 | P0 | Create practice drive from ≥1 collection + rule | Drive id; pool seeded |
| DRV-03 | P0 | Approve pool | Pool locked/approved |
| DRV-04 | P0 | Assign campus (Demo College or test college) | Assignment + student links |
| DRV-05 | P1 | Mark Ready with **no** students | Blocked with clear guard message |
| DRV-06 | P0 | Mark Ready with students, then Publish | Status Ready → Live/Published |
| DRV-07 | P1 | College Admin cannot mutate platform drive APIs | 403 on write endpoints |
| DRV-08 | P2 | Create mock/coding/hiring drive types | Type-specific fields accepted |

---

## 13. Path A end-to-end (PATHA) — P0

See [WF-PATH-A.md](./03_Workflow_Validation/WF-PATH-A.md).

| ID | Priority | Actor | Steps | Expected |
|----|----------|-------|-------|----------|
| PATHA-01 | P0 | SA | Published QB visible | Browse has rows |
| PATHA-02 | P0 | SA | Collection filled | Count ≥ 1 |
| PATHA-03 | P0 | SA | Drive assembled + pool approved | Pool locked |
| PATHA-04 | P0 | SA | Campus assigned + published | Drive live |
| PATHA-05 | P0 | College Admin | Open Campus Drives | Drive name visible |
| PATHA-06 | P0 | Student | Open Tests | Drive listed |
| PATHA-07 | P0 | Student | Instructions / start exam | Session starts |
| PATHA-08 | P1 | Student + College | Submit; score visible both sides | Results + integrity/results views |

**UAT Go:** PATHA-01…07. **No-Go:** any of PATHA-01…06 fail.

---

## 14. Path B — campus-authored (PATHB)

College Admin only; separate bank. See [WF-PATH-B.md](./03_Workflow_Validation/WF-PATH-B.md).

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| PATHB-01 | P1 | Campus QB has Active questions | `college_questions` rows |
| PATHB-02 | P1 | Publish campus assessment | Definition with questions |
| PATHB-03 | P1 | Create live campaign (audience + window) | Campaign active in window |
| PATHB-04 | P1 | Student completes My Assessments | Attempt recorded |
| PATHB-05 | P1 | Faculty/college sees results/integrity | Scores/flags visible |
| PATHB-06 | P0 | Confirm Path A assign did **not** populate campus QB | No unintended sync |

---

## 15. College portal admin surfaces (CAMP)

Base: `/app/college-portal`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| CAMP-01 | P0 | Login as college_admin → dashboard | Shell + nav load |
| CAMP-02 | P0 | Students CRUD + optional CSV bulk | Create/list/detail work |
| CAMP-03 | P0 | Campus Drives shows only assigned Path A drives | No other colleges’ drives |
| CAMP-04 | P1 | Campaigns / assessments / campus QB | Path B authoring works |
| CAMP-05 | P1 | Analytics / integrity pages | Load without crash |
| CAMP-06 | P1 | Settings / departments | Save/load profile settings |
| CAMP-07 | P1 | Billing (college_admin only) | Accessible to admin; denied to staff if gated |
| CAMP-08 | P1 | Campus Admins management | Invite/list campus admins |
| CAMP-09 | P2 | Workflows / Technical Skills | Coming Soon (no crash) |

---

## 16. Workflows, analytics, notifications (WF / AN / NTF)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| WF-01 | P2 | Open `/workflows` Aptitude / Soft Skills / Technical views | Each category view loads |
| AN-01 | P1 | Open `/analytics` overview, colleges, reports | Views load; no crash on switch |
| AN-02 | P2 | Open assessment/learning/student/skills/voice analytics leaves | Soft load OK |
| NTF-01 | P1 | Notifications: Announcements + Email Templates tabs | Both load |
| NTF-02 | P1 | Create announcement without title/body | Blocked with toast |
| NTF-03 | P1 | XSS in announcement title | Escaped |
| NTF-04 | P2 | Create valid announcement | Appears in list |

---

## 17. Billing, modules, AI config, settings (BILL / MOD / AI / SET)

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| BILL-01 | P1 | Open `/billing` | Fee-collection / college breakdown UI loads (not SaaS plans unless product changed) |
| MOD-01 | P1 | Open `/modules` | Module list loads |
| MOD-02 | P1 | Toggle module for a college (if data present) | Persists on reload |
| AI-01 | P0 | Open `/ai-config` all tabs (services, models, prompts, quotas, monitoring) | Tabs load |
| AI-02 | P0 | Verify SPOF services `question_bank` and `drive_generation` configurable / healthy | Path A AI features not silently broken |
| AI-03 | P2 | SMTP / test-email tool (if present) | Sends or fails with clear error |
| SET-01 | P1 | System settings load; Backup & Security tab | Loads |
| SET-02 | P1 | Audit trail loads; filters present | List or empty state |
| SET-03 | P2 | After college create/suspend, audit entry appears | Action logged |

---

## 18. Security & isolation (SEC)

See [WAVE1_RBAC_AUTH.md](./06_Security_Validation/WAVE1_RBAC_AUTH.md).

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| SEC-01 | P0 | Unauthenticated `GET` admin API | 401 |
| SEC-02 | P0 | HR/Engineer token on `/api/superadmin/*` mutating routes | 403 |
| SEC-03 | P0 | College Admin cannot write platform `/api/drives` | 403 |
| SEC-04 | P0 | College A cannot read College B students/drives (IDOR) | 403/404/empty — never other tenant data |
| SEC-05 | P0 | Super Admin bypasses permission guards | All Super Admin routes reachable |
| SEC-06 | P1 | Expired/invalid JWT | 401; UI redirects to login |
| SEC-07 | P1 | Direct deep-link to admin route as student | Denied |

---

## 19. Learning Hub / AI Studio / Voice Studio soft smoke (LH)

**Priority P2.** Goal: no crash, not full product UAT.

Sample leaves (full catalog in `client/tests/e2e/sprint-1a/data/menus.ts`):

- Knowledge Library dashboard / assets / organization / collections
- Learning Companion, Course Builder, Course Catalog, Learning Journey
- AI Studio: content generator, review, improver, translation, embeddings
- Voice Studio: tutor voices, languages, audio library

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| LH-01 | P2 | Visit each soft menu path | HTTP 200 UI; shell intact; empty/coming-soon acceptable |

---

## 20. CRUD + soft-delete matrix (CRUD)

Validate delete semantics match product intent (status flip vs `deleted_at`). Reference handover §8 / `17-crud-soft-delete.spec.ts`.

| Entity | Delete behavior to verify | Extra guards |
|--------|---------------------------|--------------|
| Roles | Prefer `deleted_at`; excluded from lists | System roles blocked; roles with users blocked |
| Users | Deactivate (`inactive` / `is_active=false`) | Prefer protect last super_admin |
| Colleges | Suspend (not necessarily `deleted_at`) | Unique email under concurrency |
| Categories | Deactivate | Duplicate name → clean 4xx |
| Announcements / email templates | Deactivate | — |
| Question bank | Soft deactivate + optional hard delete for SA only | Soft-deleted not fillable |

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| CRUD-01 | P1 | Create → list → update → deactivate → confirm hidden from default list | Lifecycle holds per entity |
| CRUD-02 | P1 | Attempt restore via activate (where endpoint exists) | Record returns to active lists |
| CRUD-03 | P2 | Confirm no dedicated “undo delete” distinct from activate | Documented behavior |

---

## Suggested execution order

1. **AUTH + NAV + DASH** — portal reachable  
2. **COLL + ONB** — tenants exist  
3. **USR + ROL + SEC** — access model sound  
4. **QB → QC → DRV → PATHA** — core Assessment Hub loop  
5. **CAMP + PATHB** — college side  
6. **AI-01/02, NTF, BILL, MOD, SET, AN** — administration  
7. **LH soft smoke + CRUD matrix** — breadth / data hygiene  
8. **UAT sign-off** — [WAVE1_UAT.md](./14_UAT_Checklists/WAVE1_UAT.md)

---

## Known caveats (watch during validation)

1. Login path is `/auth/login`.
2. Docker seed Super Admin password is typically `gradlogic123` — confirm before filing auth bugs.
3. Path A and Path B use **separate** question stores.
4. Many Learning Hub / AI Studio / Journey pages are soft (load-only).
5. College Workflows and Technical Skills may be Coming Soon.
6. Superadmin e2e is **read-only** unless `ADMIN_ALLOW_MUTATIONS=1`.
7. Watch for: duplicate category → 500; concurrent college email creates → multiple 201s (see handover findings).

---

## Traceability

| Doc / suite | Maps to |
|-------------|---------|
| This file | Admin portal scenario catalog |
| [WAVE1_FEATURES.md](./02_Functional_Validation/WAVE1_FEATURES.md) | Feature matrix status |
| [WF-COLLEGE-ONBOARDING.md](./03_Workflow_Validation/WF-COLLEGE-ONBOARDING.md) | ONB-* |
| [WF-PATH-A.md](./03_Workflow_Validation/WF-PATH-A.md) | PATHA-*, DRV-*, QC-* |
| [WF-PATH-B.md](./03_Workflow_Validation/WF-PATH-B.md) | PATHB-* |
| [WAVE1_RBAC_AUTH.md](./06_Security_Validation/WAVE1_RBAC_AUTH.md) | SEC-* |
| [WAVE1_UAT.md](./14_UAT_Checklists/WAVE1_UAT.md) | Go/No-Go |
| `client/tests/e2e/superadmin/` | AUTH–SET module automation |
| `client/tests/e2e/sprint-1a/` | ONB + Path A automation |
| `ADMIN_PORTAL_TEST_HANDOVER.md` | Historical results + open defects |
