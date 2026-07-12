# GradLogic Student Mobile App — v1 Specification

**Version:** 1.0  
**Date:** 2026-07-09  
**Platform:** iOS + Android (React Native / Expo)  
**Backend:** https://api.gradlogic.atherasys.com  

---

## 1. Scope (v1)

| In scope | Out of scope (later) |
|----------|----------------------|
| Login + token storage | Coding practice / Monaco editor |
| Dashboard (streak, XP, drives) | Mock interview (voice) |
| Learn — enrolled programs & modules | Offline mode |
| Practice — MCQ quiz sessions | Push notifications |
| MCQ proctored exams (camera) | Native admin monitor app |
| Profile + logout | Biometric login |

**College admin monitoring:** continues on web (`/app/college-portal`, `/app/admin/monitoring`).

---

## 2. Production URLs

| Item | URL |
|------|-----|
| API base | `https://api.gradlogic.atherasys.com` |
| Web app (reference) | `https://gradlogic.atherasys.com` |

### Test credentials

| Field | Value |
|-------|-------|
| Email | `admin@gradlogic.com` or student account |
| Password | `gradlogic123` |

---

## 3. Mobile proctoring rules (backend)

Exams started from the mobile app send `clientType: "mobile_app"` (or header `X-Client-Type: mobile_app`).

| Rule | Web | Mobile app |
|------|-----|------------|
| `mobile_detected` (AI) | Critical violation | **Ignored** |
| Tab switch / copy / paste | Violations | N/A |
| App backgrounded | N/A | Violation (`APP_BACKGROUNDED`) |
| Face not detected | Violation | Violation |
| Multiple faces | Violation | Violation |
| Face mismatch | Critical | Critical |

`drive_students.client_type` stores `web` or `mobile_app`. Live monitoring shows `clientType` per session.

**Migration:** `docker/init-db/31-mobile-exam-client.sql`, `server/migrations/phase11_mobile_exam_client.sql`

---

## 4. Screen map

```
Login
  └── (tabs)
        ├── Home (dashboard)
        ├── Learn (enrollments list)
        │     └── Program detail (modules)
        ├── Practice (topics → quiz)
        ├── Exams (drives list)
        │     └── Instructions
        │           └── Exam player (proctored MCQ)
        └── Profile
```

---

## 5. API mapping

### Auth
| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/api/auth/login` |
| Profile | GET | `/api/auth/me` |
| Portal features | GET | `/api/students/portal-features` |

### Dashboard
| Action | Method | Endpoint |
|--------|--------|----------|
| Gamification summary | GET | `/api/gamification/me` |
| Daily practice target | GET | `/api/practice/daily-target` |

### Learn
| Action | Method | Endpoint |
|--------|--------|----------|
| My enrollments | GET | `/api/student-learning/my-enrollments` |
| Program modules | GET | `/api/student-learning/my-enrollments/:programId/modules` |
| Start module | POST | `/api/student-learning/my-enrollments/:programId/modules/:moduleId/start` |
| Complete module | POST | `/api/student-learning/my-enrollments/:programId/modules/:moduleId/complete` |

### Practice
| Action | Method | Endpoint |
|--------|--------|----------|
| Topics | GET | `/api/practice/topics` |
| Start session | POST | `/api/practice/sessions` |
| Submit answer | POST | `/api/practice/sessions/:id/answer` |
| Complete | PUT | `/api/practice/sessions/:id/complete` |

### Exams
| Action | Method | Endpoint |
|--------|--------|----------|
| My drives | GET | `/api/exam-sessions/my-drives` |
| Start session | POST | `/api/exam-sessions/:driveId/start` body: `{ clientType: "mobile_app" }` |
| Get session + questions | GET | `/api/exam-sessions/:driveId/session` |
| Autosave answer | PUT | `/api/exam-sessions/:driveId/save` |
| Submit | POST | `/api/exam-sessions/:driveId/submit` |

### Proctoring (mobile)
| Action | Method | Endpoint |
|--------|--------|----------|
| Log event | POST | `/api/proctoring/events` |
| AI frame analyze | POST | `/api/proctoring/analyze` |

Mobile proctoring events: `APP_BACKGROUNDED`, `APP_FOREGROUNDED`, `NETWORK_DISCONNECT`, `FACE_NOT_DETECTED`, `CAMERA_DENIED`.

---

## 6. Project structure

```
mobile/
  app/                    # Expo Router screens
  src/
    lib/api.ts            # Axios + auth headers
    lib/auth.ts           # Secure token storage
    hooks/useProctoring.ts
    types/index.ts
  app.json
  package.json
  README.md
```

---

## 7. Run locally

```bash
cd mobile
npm install
cp .env.example .env
npm start
# Press i (iOS simulator) or a (Android emulator)
```

Set `EXPO_PUBLIC_API_URL=https://api.gradlogic.atherasys.com` in `.env`.

---

## 8. Release checklist

- [ ] Run DB migration `phase11_mobile_exam_client.sql` on production
- [ ] Deploy backend with mobile proctoring rules
- [ ] Test login on physical iOS + Android devices
- [ ] Test proctored exam with camera permissions
- [ ] Verify college admin live monitor shows `clientType: mobile_app`
- [ ] App Store / Play Store privacy disclosures (camera, mic if used)

---

## 9. Related docs

- `ADMIN_PORTAL_TEST_HANDOVER.md` — college admin web testing
- `TECH_STACK.md` — platform overview
