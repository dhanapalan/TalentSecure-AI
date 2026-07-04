# Phase 2 - SuperAdmin Portal Development Specification

**Date**: 2026-07-04  
**Status**: READY TO START  
**Estimated Duration**: 2-3 weeks  
**Scope**: Users Management, Workflows, Analytics

---

## Phase 2 Overview

Phase 2 extends the SuperAdmin portal with three major feature areas:
1. **Users Management** - All Users, Role Management, Audit Trail
2. **Workflows** - Assessment template management
3. **Analytics** - Platform insights and performance metrics

---

## 1. USERS MANAGEMENT (10 days)

### 1.1 All Users Page (`/app/superadmin/users`)

**Purpose**: View all platform users with advanced filtering and search

#### Features
- List all users (students, college admins, TPO, mentors, admins)
- Search by name, email, college, phone
- Filter by:
  - Role (student, admin, tpo, mentor, super_admin)
  - Status (active, inactive, suspended, deleted)
  - College (dropdown)
  - Registration date range
  - Last login date range

#### UI Components
- Search bar with autocomplete
- Filter sidebar with collapsible sections
- User table with columns:
  - Name + Avatar
  - Email
  - Role (badge)
  - College
  - Status (badge)
  - Joined Date
  - Last Login
  - Actions (View, Edit, Suspend, Delete)
- Pagination (50, 100, 250 per page)
- Bulk actions (Select all, Suspend selected, Delete selected)
- Export to CSV button

#### API Endpoints Needed (8)
```
GET    /api/superadmin/users                    - List users (with pagination, filters, search)
POST   /api/superadmin/users/search             - Advanced search
GET    /api/superadmin/users/:id                - Get user details
PUT    /api/superadmin/users/:id                - Update user
DELETE /api/superadmin/users/:id                - Soft delete user
POST   /api/superadmin/users/:id/suspend        - Suspend user
POST   /api/superadmin/users/:id/unsuspend      - Unsuspend user
POST   /api/superadmin/users/bulk-action        - Bulk operations
```

#### Validations
- Name: 2-100 characters
- Email: Valid format, unique per user
- Phone: Valid format or empty
- Role: Only super_admin can modify roles
- Status: Can only be changed by super_admin

---

### 1.2 Role Management Page (`/app/superadmin/users/roles`)

**Purpose**: Define and manage user roles and permissions

#### Features
- View all roles (6 default roles)
- Create custom roles
- Edit role permissions
- Delete custom roles (not system roles)
- Permission matrix view
- Role usage statistics

#### Roles
```
1. super_admin    - Full platform access
2. college_admin  - College management only
3. tpo            - Placement officer (college level)
4. mentor         - Assessment/guidance mentor
5. student        - Student user
6. corporate_hr   - Corporate recruiter (for future)
```

#### Permissions Model
```
Each role has permissions:
- colleges:read, colleges:write, colleges:delete
- users:read, users:write, users:delete
- questions:read, questions:write, questions:delete
- assessments:read, assessments:write, assessments:delete
- analytics:read
- audit:read
- settings:write

Example:
super_admin:   ALL permissions
college_admin: colleges:*, users:read, assessments:*
student:       users:read (own), assessments:read
```

#### UI Components
- Role list with edit/delete buttons
- Role detail modal with:
  - Name
  - Description
  - Permission checkboxes (grid)
  - Usage count (how many users)
  - Created date, Last modified
- "Create Role" button and form
- Permission preview for each role

#### API Endpoints Needed (7)
```
GET    /api/superadmin/roles                    - List roles
GET    /api/superadmin/roles/:id                - Get role details
POST   /api/superadmin/roles                    - Create custom role
PUT    /api/superadmin/roles/:id                - Update role
DELETE /api/superadmin/roles/:id                - Delete custom role
GET    /api/superadmin/roles/:id/permissions   - Get role permissions
PUT    /api/superadmin/roles/:id/permissions   - Update permissions
```

---

### 1.3 Audit Trail Page (`/app/superadmin/users/audit-trail`)

**Purpose**: Track all system activities and changes for compliance

#### Features
- Timeline view of all actions
- Filter by:
  - Action type (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT)
  - User (who performed the action)
  - Resource (what was affected)
  - Date range
  - Impact level (HIGH, MEDIUM, LOW)
- Search by IP address, email, resource ID
- View full audit log entry (JSON)
- Export audit logs
- Real-time activity feed

#### Audit Events to Track
```
User Actions:
- LOGIN / LOGOUT
- CREATE / UPDATE / DELETE (college, user, question, assessment, etc.)
- SUSPEND / UNSUSPEND
- ROLE_CHANGE
- PASSWORD_RESET
- PERMISSION_CHANGE

System Actions:
- DATABASE_BACKUP
- CONFIGURATION_CHANGE
- API_ERROR (high severity)
- SECURITY_EVENT
- BULK_OPERATION
```

#### UI Components
- Timeline view (vertical list of events)
- Filter sidebar
- Event detail card showing:
  - Timestamp
  - User (name + role)
  - Action (type + description)
  - Resource (what was affected)
  - IP address
  - Changes (before/after for UPDATE)
  - Status (success/failed)
- Export button (CSV, PDF)
- Real-time feed toggle

#### API Endpoints Needed (4)
```
GET    /api/superadmin/audit-trail              - List audit logs (with filters)
GET    /api/superadmin/audit-trail/:id          - Get audit entry details
POST   /api/superadmin/audit-trail/export       - Export logs
GET    /api/superadmin/audit-trail/stats        - Audit statistics
```

---

## 2. WORKFLOWS (8 days)

### 2.1 Workflows Management Page (`/app/superadmin/workflows`)

**Purpose**: Create and manage assessment workflows/templates

#### Features
- List all assessment templates
- Create new workflow template
- Edit existing templates
- Clone template
- Preview template
- View usage statistics
- Enable/disable templates
- Version control (template versions)

#### Workflow Types
```
1. Aptitude Assessment
   - Questions from: Quantitative, Reasoning, Verbal
   - Duration: 60-120 minutes
   - Sections: Speed & Distance, Time & Work, Percentages, etc.
   - Difficulty mix: Easy 20%, Medium 60%, Hard 20%

2. Soft Skills Assessment
   - Questions from: Communication, Leadership, Problem-solving
   - Duration: 30-60 minutes
   - Format: MCQ + Short answer
   - Difficulty mix: Even distribution

3. Technical Assessment
   - Questions from: Data Structures, Algorithms, System Design
   - Duration: 90-180 minutes
   - Format: MCQ + Code problem
   - Difficulty mix: Easy 10%, Medium 50%, Hard 40%

4. Custom Workflow
   - User can create custom mix
   - Configure duration, sections, scoring
   - Set pass criteria
   - Add proctoring rules
```

#### Template Configuration
```
{
  id: string
  name: string
  description: string
  type: "aptitude" | "soft-skills" | "technical" | "custom"
  sections: [
    {
      name: string
      topics: string[]
      questionCount: number
      difficulty: "easy" | "medium" | "hard"
      duration: number (minutes)
    }
  ]
  totalQuestions: number
  totalDuration: number
  passPercentage: number (0-100)
  scoringType: "percentage" | "raw" | "scaled"
  proctoring: {
    enabled: boolean
    requireCamera: boolean
    requireMicrophone: boolean
    screenLocking: boolean
  }
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResults: boolean (immediate or after deadline)
  createdBy: string
  createdAt: date
  updatedAt: date
  version: number
  isActive: boolean
  usageCount: number
}
```

#### UI Components
- Workflow list (cards with basic info)
- Workflow detail view with:
  - Basic info (name, type, description)
  - Sections grid (topics, question count, duration)
  - Configuration (pass %, scoring, proctoring)
  - Usage stats (how many times used, when)
  - Edit button, Clone button, Delete button
  - Version history dropdown
- Create/Edit modal or slide-out panel with:
  - Workflow name, type, description
  - Add sections button
  - Section builder (topic selector, question count, difficulty, duration)
  - Configuration options
  - Preview button
  - Save as draft, Publish, Cancel

#### API Endpoints Needed (9)
```
GET    /api/superadmin/workflows                    - List templates
GET    /api/superadmin/workflows/:id                - Get template
POST   /api/superadmin/workflows                    - Create template
PUT    /api/superadmin/workflows/:id                - Update template
DELETE /api/superadmin/workflows/:id                - Delete template
POST   /api/superadmin/workflows/:id/clone          - Clone template
GET    /api/superadmin/workflows/:id/versions       - Version history
POST   /api/superadmin/workflows/:id/publish        - Publish template
GET    /api/superadmin/workflows/:id/preview        - Preview template
```

---

## 3. ANALYTICS (8 days)

### 3.1 Platform Overview Page (`/app/superadmin/analytics`)

**Purpose**: High-level platform metrics and trends

#### Metrics to Display
```
KPI Cards (Top Section):
- Total Users (with growth %)
- Total Assessments Conducted (with growth %)
- Average Assessment Score
- Platform Health Score (0-100)

Charts (Middle Section):
1. User Growth (Line chart - 30 days)
   - Students registered
   - Colleges onboarded
   - Admins added

2. Assessment Volume (Area chart - 30 days)
   - Assessments conducted
   - Assessments in progress
   - Assessments passed

3. Top Performing Colleges (Bar chart)
   - Rank by: avg score, completion rate, student count
   - Show top 10

4. Assessment Category Performance (Pie chart)
   - Aptitude: % completed
   - Soft Skills: % completed
   - Technical: % completed

Real-time Updates:
- Live user count (online users)
- Recent activities feed (last 10 activities)
- Alerts (system health, quota warnings)
```

#### UI Components
- KPI cards with trend indicators (📈/📉)
- Interactive charts (switchable between time periods)
- Real-time feed sidebar
- Alerts section
- Filter by date range
- Export report button

#### API Endpoints Needed (6)
```
GET    /api/superadmin/analytics/overview          - All overview metrics
GET    /api/superadmin/analytics/user-growth       - User growth data
GET    /api/superadmin/analytics/assessment-volume - Assessment data
GET    /api/superadmin/analytics/college-performance - College rankings
GET    /api/superadmin/analytics/category-performance - Category stats
POST   /api/superadmin/analytics/export-report     - Export analytics
```

### 3.2 College Performance Page (`/app/superadmin/analytics/college-performance`)

**Purpose**: Detailed analytics per college

#### Features
- Select college from dropdown
- View college-specific metrics:
  - Total students
  - Students who completed assessment
  - Average score
  - Pass rate
  - Top performing students (top 5)
  - Category-wise performance
  - Assessment completion timeline
  - Student skill distribution

#### Comparison
- Compare 2 colleges side-by-side
- Compare with platform average
- Export college report (PDF)

#### API Endpoints Needed (4)
```
GET    /api/superadmin/analytics/college/:id      - College metrics
GET    /api/superadmin/analytics/college/:id/students - College students performance
GET    /api/superadmin/analytics/compare-colleges - Compare 2 colleges
POST   /api/superadmin/analytics/college/:id/export - Export college report
```

---

## Phase 2 API Summary

### Total New Endpoints: 38

| Section | Endpoints | Details |
|---------|-----------|---------|
| **Users** | 8 | List, CRUD, Suspend, Bulk |
| **Roles** | 7 | List, CRUD, Permissions |
| **Audit Trail** | 4 | List, Details, Export, Stats |
| **Workflows** | 9 | List, CRUD, Clone, Publish, Preview |
| **Analytics Overview** | 6 | Overview, Growth, Volume, College, Category |
| **Analytics College** | 4 | College Metrics, Students, Compare, Export |
| **Total** | **38** | |

---

## Implementation Plan

### Week 1: Users Management (Days 1-5)
- **Day 1-2**: AllUsersPage component + useAllUsers hook
- **Day 2-3**: RoleManagementPage + useRoles hook
- **Day 3-4**: AuditTrailPage + useAuditTrail hook
- **Day 4-5**: API integration testing + bug fixes

### Week 2: Workflows (Days 6-8)
- **Day 6**: WorkflowsPage + template list UI
- **Day 7**: Template editor (drag-drop sections, question selection)
- **Day 8**: API integration + preview functionality

### Week 3: Analytics (Days 9-10)
- **Day 9**: AnalyticsPage (overview charts)
- **Day 10**: CollegePerformancePage + export functionality

### Week 3: Testing & Polish (Days 11-15)
- **Days 11-12**: End-to-end testing all pages
- **Days 13-14**: Bug fixes and optimization
- **Day 15**: Documentation and handoff

---

## File Structure (Phase 2)

```
client/src/pages/superadmin/
├── users/
│   ├── AllUsersPage.tsx          (600 LOC)
│   ├── RoleManagementPage.tsx    (500 LOC)
│   └── AuditTrailPage.tsx        (600 LOC)
├── workflows/
│   ├── WorkflowsPage.tsx         (500 LOC)
│   ├── WorkflowEditor.tsx        (700 LOC)
│   └── WorkflowPreview.tsx       (300 LOC)
├── analytics/
│   ├── AnalyticsPage.tsx         (600 LOC)
│   └── CollegePerformancePage.tsx (500 LOC)

client/src/services/
├── userService.ts                (200 LOC)
├── roleService.ts                (150 LOC)
├── auditService.ts               (150 LOC)
├── workflowService.ts            (250 LOC)
└── analyticsService.ts           (200 LOC)

client/src/components/superadmin/
├── UsersFilter.tsx               (200 LOC)
├── RolePermissionMatrix.tsx      (300 LOC)
├── AuditTimeline.tsx             (250 LOC)
├── WorkflowBuilder.tsx           (400 LOC)
├── AnalyticsChart.tsx            (250 LOC)
└── CollegeComparison.tsx         (200 LOC)

server/src/controllers/
├── users.controller.ts           (400 LOC)
├── roles.controller.ts           (300 LOC)
├── auditTrail.controller.ts      (250 LOC)
├── workflows.controller.ts       (400 LOC)
└── analytics.controller.ts       (350 LOC)

server/src/routes/
├── users.routes.ts               (100 LOC)
├── roles.routes.ts               (80 LOC)
├── auditTrail.routes.ts          (60 LOC)
├── workflows.routes.ts           (100 LOC)
└── analytics.routes.ts           (80 LOC)
```

**Total Phase 2 Code**: ~8,500 LOC (Frontend + Backend)

---

## Key Technologies & Patterns

### Frontend
- React 18 + TypeScript
- React Router for navigation
- Custom hooks for data fetching (useAllUsers, useRoles, etc.)
- Tailwind CSS for styling
- React Hot Toast for notifications
- Heroicons for UI icons
- Recharts for analytics visualization

### Backend
- Node.js + Express
- PostgreSQL for persistence
- JWT authentication
- Role-based access control (RBAC)
- Soft deletes (deleted_at field)
- Audit logging on all mutations
- Parameterized queries (SQL injection prevention)

### Architectural Patterns
- Service layer pattern (collegeService, userService, etc.)
- Custom React hooks for data management
- Controlled components with form validation
- Error boundary components
- Loading skeleton components
- Responsive design (mobile-first)

---

## Testing Requirements

### Unit Tests
- Service layer tests (mock API responses)
- Component tests (snapshot, props, interactions)
- Utility function tests (formatters, validators)

### Integration Tests
- User flow: Search users → Filter → View details → Edit
- Workflow flow: Create template → Configure sections → Publish
- Analytics: Load charts → Change date range → Export

### E2E Tests (Selenium/Cypress)
- Full user CRUD workflow
- Workflow template creation and usage
- Analytics dashboard interactions

---

## Success Criteria for Phase 2

✅ All 3 feature areas implemented  
✅ 38 API endpoints built and tested  
✅ 6 pages with advanced UX  
✅ Zero TypeScript errors  
✅ All CRUD operations working  
✅ Responsive design on mobile/tablet/desktop  
✅ Comprehensive error handling  
✅ Loading states on all async operations  
✅ User feedback via toasts  
✅ 90%+ test coverage  

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Complex workflow builder | Medium | High | Start with UI mockup, iterate |
| Analytics performance (large datasets) | Medium | High | Use pagination, caching, aggregation |
| Permission matrix complexity | Medium | Medium | Prebuilt role templates, copy permissions |
| Audit trail volume | Low | Medium | Log cleanup job, archiving strategy |
| Timeline slippage | Low | Medium | Daily standups, clear scope boundaries |

---

## Dependencies

**No external blockers** - Phase 1 is complete and tested.

Phase 2 can start immediately.

---

## Next Steps

1. ✅ Review this specification
2. Create frontend pages skeleton
3. Create backend controllers skeleton
4. Implement AllUsersPage (first feature)
5. Build API endpoints for users management
6. Test end-to-end
7. Move to Workflows
8. Move to Analytics

Ready to start Phase 2 implementation? 🚀

---

**Generated**: 2026-07-04  
**Status**: READY TO START  
**Estimated Duration**: 2-3 weeks  
**Total Endpoints**: 38 (vs Phase 1: 29)
