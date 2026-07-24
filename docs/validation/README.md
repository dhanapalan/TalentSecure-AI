# GradLogic — Validation Master Plan

Codebase-mapped application validation for TalentSecure-AI / GradLogic.

**Wave 1 focus:** Core placement loop — Organization (Colleges) → Assessment Hub Path A → College portal review → Student learn / practice / exam → AI config SPOFs.

Other hubs/roles are outlined as backlog. This tree is the **source of truth** for QA ownership; automation lives under [`client/tests/e2e/sprint-1a/`](../../client/tests/e2e/sprint-1a/).

**Admin portal scenarios (executable catalog):** [ADMIN_PORTAL_VALIDATION_SCENARIOS.md](./ADMIN_PORTAL_VALIDATION_SCENARIOS.md) — P0–P2 scenarios for Super Admin + College Admin validation, mapped to automation and Wave 1 workflows.

---

## Coverage legend

| Status | Meaning |
|--------|---------|
| `AUTOMATED` | Covered by a stable automated suite |
| `PARTIAL` | Smoke / landing / incomplete path automated |
| `MANUAL` | Checklist executed by hand |
| `BACKLOG` | Not yet scheduled |

---

## Workstreams

| # | Folder | Type |
|---|--------|------|
| 01 | [UI Validation](./01_UI_Validation/) | Functional |
| 02 | [Functional / Feature Validation](./02_Functional_Validation/) | Functional |
| 03 | [Workflow Validation](./03_Workflow_Validation/) | Functional (**primary**) |
| 04 | [API Validation](./04_API_Validation/) | Functional |
| 05 | [Database Validation](./05_Database_Validation/) | Functional |
| 06 | [Security Validation](./06_Security_Validation/) | Functional + NFR |
| 07 | [Integration Validation](./07_Integration_Validation/) | Functional |
| 08 | [AI Validation](./08_AI_Validation/) | Functional |
| 09 | [Performance](./09_Performance_Validation/) | Non-functional |
| 10 | [Load & Stress](./10_Load_Stress_Validation/) | Non-functional |
| 11 | [Accessibility](./11_Accessibility_Validation/) | Non-functional |
| 12 | [Compatibility](./12_Compatibility_Validation/) | Non-functional |
| 13 | [Regression](./13_Regression_Validation/) | Cross-cutting |
| 14 | [UAT Checklists](./14_UAT_Checklists/) | Acceptance |

**Traceability matrix:** [TRACEABILITY.md](./TRACEABILITY.md)

---

## Roles & portal homes

Source: `client/src/pages/auth/login/loginRoles.ts`, `ProtectedRoute` role homes.

| Login tab | Backend roles | Home |
|-----------|---------------|------|
| Super Admin | `super_admin`, `admin` | `/app/superadmin/dashboard` |
| College Admin | `college_admin`, `college`, `college_staff`, `placement_cell` | `/app/college-portal/dashboard` (placement_cell → `/app/placement-cell-dashboard`) |
| Student | `student` | `/app/student-portal` (or onboarding / setup-password) |
| Faculty | `instructor`, `mentor`, `college_staff` | faculty / mentor / college portals |
| Platform Admin | `hr`, `engineer`, `cxo`, … | role-specific dashboards |
| Recruiter / Company HR | `company`, `hr` | `/app/company` or HR dashboard |

**Wave 1 actors:** Super Admin, College Admin, Student only.

---

## Dual assessment pipelines (critical)

| Path | Owner | Question store | Assembly | Student surface |
|------|-------|----------------|----------|-----------------|
| **A — Platform** | Super Admin | `question_bank` | Collections → drives → assign-campus | `/tests`, `/exam/:driveId/*` |
| **B — Campus** | College staff | `college_questions` | Assessments → campaigns | `/my-assessments` |

Assigning a platform drive does **not** copy questions into the campus bank. College reviews Path A via `/app/college-portal/drives`.

---

## Wave 1 scope map

```
Super Admin
  Organization → Colleges
  Assessment Hub → QB → Collections → Builder (drives) → Assign Campus → Ready/Publish
  AI Config (SPOF: question_bank / drive_generation)
College Admin
  Campus Drives (review assigned) · Students · (Path B: QB/Assessments/Campaigns)
Student
  Learn → Practice → Tests/Exam → Results
```

---

## Source-of-truth code

| Layer | Location |
|-------|----------|
| UI routes | `client/src/App.tsx`, SuperAdmin / College / Student layouts |
| APIs | `server/src/app.ts` mounts |
| Pipeline health | `server/src/services/assessmentPipeline.service.ts` |
| Sprint 1A automation | `client/tests/e2e/sprint-1a/` |
| College demo script | `COLLEGE_DEMO_GUIDE.md` |

---

## How to use

1. For admin portal QA, start with [ADMIN_PORTAL_VALIDATION_SCENARIOS.md](./ADMIN_PORTAL_VALIDATION_SCENARIOS.md) (suggested execution order + P0 blockers).  
2. Pick a workstream folder for deeper checklists.  
3. Execute Wave 1 checklist rows; update status as you automate.  
4. Keep [TRACEABILITY.md](./TRACEABILITY.md) in sync when adding specs.  
5. Promote backlog modules to Wave 2 by expanding their folder READMEs into full checklists.
