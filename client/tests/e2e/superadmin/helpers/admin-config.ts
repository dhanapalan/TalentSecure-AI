// =============================================================================
// SuperAdmin QA Automation Suite — Environment & Route Configuration
// -----------------------------------------------------------------------------
// Single source of truth for URLs, credentials and the portal route map used by
// the SuperAdmin (Admin) portal validation specs. Everything is env-overridable
// so the same suite runs against local dev, staging, or the production QA
// environment described in ADMIN_PORTAL_TEST_HANDOVER.md.
//
//   Local (default):   npm run test:superadmin
//   Production QA:      BASE_URL=https://gradlogic.atherasys.com \
//                       API_URL=https://api.gradlogic.atherasys.com/api \
//                       npm run test:superadmin
//
// Mutating flows (create college / user / role / announcement, approve/reject)
// are OFF by default so a run never writes to a shared/production database.
// Enable them explicitly against a throwaway environment:
//   ADMIN_ALLOW_MUTATIONS=1 npm run test:superadmin
// =============================================================================

/** Frontend origin under test (no trailing slash). */
export const BASE_URL = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');

/** API base including the `/api` suffix (no trailing slash). */
export const API_URL = (process.env.API_URL || 'http://localhost:5050/api').replace(/\/$/, '');

/** True when the target is a local dev server (controls the Playwright webServer). */
export const IS_LOCAL = /localhost|127\.0\.0\.1/.test(BASE_URL);

/** Whether destructive/creating flows are permitted this run. */
export const ALLOW_MUTATIONS = ['1', 'true', 'yes'].includes(
  (process.env.ADMIN_ALLOW_MUTATIONS || '').toLowerCase()
);

// ── Credentials ──────────────────────────────────────────────────────────────
// Defaults come straight from the QA handover. Override per-environment via env
// vars when the seeded passwords differ (e.g. local dev seeds).

export const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@gradlogic.com',
  password: process.env.ADMIN_PASSWORD || 'gradlogic123',
  role: 'super_admin',
};

/** A seeded non-super-admin used to prove `/app/superadmin/*` is blocked. */
export const NON_ADMIN = {
  email: process.env.NONADMIN_EMAIL || 'hr@gradlogic.com',
  password: process.env.NONADMIN_PASSWORD || 'gradlogic123',
  role: 'hr',
};

// ── Route map ────────────────────────────────────────────────────────────────
// `path` is relative to BASE_URL. `heading` is asserted verbatim when the page
// renders a static title; pages with dynamic headings omit it and fall back to
// the resilient "portal shell rendered, not blocked, no crash" assertion.

export interface AdminRoute {
  key: string;
  label: string;
  path: string;
  heading?: string;
}

export const ROUTES: AdminRoute[] = [
  { key: 'dashboard',        label: 'Dashboard',            path: '/app/superadmin/dashboard',                     heading: 'Admin Dashboard' },
  { key: 'colleges',         label: 'All Colleges',         path: '/app/superadmin/colleges',                      heading: 'All Colleges' },
  { key: 'colleges-new',     label: 'Add New College',      path: '/app/superadmin/colleges/new',                  heading: 'Add New College' },
  { key: 'colleges-req',     label: 'College Requests',     path: '/app/superadmin/colleges/requests',             heading: 'College Requests' },
  { key: 'students',         label: 'Students',             path: '/app/superadmin/students',                      heading: 'Students' },
  { key: 'approvals',        label: 'Approvals',            path: '/app/superadmin/approvals',                     heading: 'Approvals' },
  { key: 'modules',          label: 'Modules',              path: '/app/superadmin/modules',                       heading: 'Module Management' },
  { key: 'users',            label: 'All Users',            path: '/app/superadmin/users',                         heading: 'All Users' },
  { key: 'roles',            label: 'Role Management',      path: '/app/superadmin/roles',                         heading: 'Role Management' },
  { key: 'roles-matrix',     label: 'Permission Matrix',    path: '/app/superadmin/roles/matrix' },
  { key: 'qb',               label: 'All Questions',        path: '/app/superadmin/question-bank',                 heading: 'All Questions' },
  { key: 'qb-ai',            label: 'AI Question Generator', path: '/app/superadmin/question-bank/ai-generator',   heading: 'AI Question Generator' },
  { key: 'qb-categories',    label: 'Categories & Topics',  path: '/app/superadmin/question-bank/categories',      heading: 'Categories & Topics' },
  { key: 'qb-review',        label: 'Review Queue',         path: '/app/superadmin/question-bank/review-queue',    heading: 'Review Queue' },
  { key: 'qb-import',        label: 'Import from Books',    path: '/app/superadmin/question-bank/import-books',    heading: 'Import from Books' },
  { key: 'workflows',        label: 'Workflows',            path: '/app/superadmin/workflows' },
  { key: 'analytics',        label: 'Analytics',            path: '/app/superadmin/analytics' },
  { key: 'notifications',    label: 'Notifications',        path: '/app/superadmin/notifications',                 heading: 'Notifications' },
  { key: 'billing',          label: 'Billing',              path: '/app/superadmin/billing',                       heading: 'Billing' },
  { key: 'ai-config',        label: 'AI Configuration',     path: '/app/superadmin/ai-config' },
  { key: 'settings',         label: 'System Settings',      path: '/app/superadmin/settings' },
  { key: 'audit',            label: 'Audit Logs',           path: '/app/superadmin/audit-trail',                   heading: 'Audit Trail' },
];

export const routeByKey = (key: string): AdminRoute => {
  const r = ROUTES.find((x) => x.key === key);
  if (!r) throw new Error(`Unknown admin route key: ${key}`);
  return r;
};
