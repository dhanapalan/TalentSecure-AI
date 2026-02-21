// =============================================================================
// TalentSecure AI — Centralized RBAC Permission Matrix
// =============================================================================
// Defines the permission matrix for the four primary roles:
//   Admin (super_admin) — unrestricted access
//   HR (hr)             — campus/student/exam management, monitoring, violations
//   Employee (engineer)  — exam monitoring, violations, reset/resume only
//   CxO (cxo)           — read-only dashboards, stats, analytics
//
// College roles (college_admin, college_staff) are maintained for campus-scoped ops.
// =============================================================================

import { UserRole } from "../types/index.js";

// ── Permission Actions ───────────────────────────────────────────────────────

export type PermissionAction =
  // Campus
  | "campus:read"
  | "campus:create"
  | "campus:update"
  | "campus:delete"
  // Students
  | "student:list"
  | "student:read"
  | "student:create"
  | "student:update"
  | "student:delete"
  // Exams
  | "exam:list"
  | "exam:read"
  | "exam:generate"
  | "exam:assign"
  | "exam:terminate"
  | "exam:progress"
  | "exam:session:terminate"
  | "exam:session:reset"
  | "exam:take"
  | "exam:auto-save"
  // Question Bank
  | "questionbank:read"
  | "questionbank:create"
  | "questionbank:update"
  | "questionbank:delete"
  | "questionbank:hard-delete"
  // Cheating / Violations
  | "cheating:read"
  | "cheating:stats"
  | "cheating:report"
  // Admin Operations
  | "admin:interrupted-exams"
  | "admin:resolve-interruption"
  // Users
  | "user:list"
  | "user:update-role"
  | "user:delete"
  // Roles (job roles)
  | "role:read"
  | "role:create"
  // HR Dashboard
  | "hr:stats"
  | "hr:activity"
  // College Operations
  | "college:add-students"
  | "college:students"
  | "college:exams"
  | "college:stats"
  // Analytics
  | "analytics:read"
  // Segmentation
  | "segmentation:read"
  // Proctoring
  | "proctoring:monitor";

// ── Role → Permissions Map ───────────────────────────────────────────────────

const ADMIN_PERMISSIONS: PermissionAction[] = [
  // Admin has ALL permissions — unrestricted
  "campus:read", "campus:create", "campus:update", "campus:delete",
  "student:list", "student:read", "student:create", "student:update", "student:delete",
  "exam:list", "exam:read", "exam:generate", "exam:assign", "exam:terminate",
  "exam:progress", "exam:session:terminate", "exam:session:reset",
  "questionbank:read", "questionbank:create", "questionbank:update",
  "questionbank:delete", "questionbank:hard-delete",
  "cheating:read", "cheating:stats", "cheating:report",
  "admin:interrupted-exams", "admin:resolve-interruption",
  "user:list", "user:update-role", "user:delete",
  "role:read", "role:create",
  "hr:stats", "hr:activity",
  "college:add-students", "college:students", "college:exams", "college:stats",
  "analytics:read", "segmentation:read", "proctoring:monitor",
];

const HR_PERMISSIONS: PermissionAction[] = [
  // Campus management
  "campus:read", "campus:create", "campus:update", "campus:delete",
  // Student management
  "student:list", "student:read", "student:create", "student:update", "student:delete",
  // Exam management
  "exam:list", "exam:read", "exam:generate", "exam:assign", "exam:terminate",
  "exam:progress", "exam:session:terminate", "exam:session:reset",
  // Question bank
  "questionbank:read", "questionbank:create", "questionbank:update", "questionbank:delete",
  // Violations
  "cheating:read", "cheating:stats",
  // Admin ops (interruptions)
  "admin:interrupted-exams", "admin:resolve-interruption",
  // Roles (job roles)
  "role:read", "role:create",
  // HR dashboard
  "hr:stats", "hr:activity",
  // Analytics & monitoring
  "analytics:read", "segmentation:read", "proctoring:monitor",
];

const ENGINEER_PERMISSIONS: PermissionAction[] = [
  // Read-only listings
  "campus:read",
  "exam:list", "exam:read",
  "questionbank:read",
  // Monitoring & session control
  "exam:progress", "exam:session:terminate", "exam:session:reset",
  // Violations (review)
  "cheating:read", "cheating:stats",
  // Admin ops (interruptions — view & resolve)
  "admin:interrupted-exams", "admin:resolve-interruption",
  // Proctoring
  "proctoring:monitor",
  // Assessments (view + code editor)
  "analytics:read",
];

const CXO_PERMISSIONS: PermissionAction[] = [
  // READ-ONLY: dashboards, statistics, metrics, analytics, trends
  "campus:read",
  "student:list", "student:read",
  "exam:list", "exam:read", "exam:progress",
  "questionbank:read",
  "cheating:stats",
  "hr:stats", "hr:activity",
  "role:read",
  "analytics:read",
];

// College roles
const COLLEGE_ADMIN_PERMISSIONS: PermissionAction[] = [
  "campus:read",
  "college:add-students", "college:students", "college:exams", "college:stats",
  "exam:list", "exam:read", "exam:generate", "exam:progress",
  "exam:session:terminate", "exam:session:reset",
  "questionbank:read", "questionbank:create", "questionbank:update", "questionbank:delete",
  "cheating:read", "cheating:stats",
  "proctoring:monitor",
  "student:list", "student:read",
  "analytics:read",
  "admin:interrupted-exams", "admin:resolve-interruption",
];

const COLLEGE_STAFF_PERMISSIONS: PermissionAction[] = [
  "campus:read",
  "college:add-students", "college:students", "college:exams", "college:stats",
  "exam:list", "exam:read", "exam:progress",
  "exam:session:terminate", "exam:session:reset",
  "cheating:read",
  "student:list", "student:read",
];

const STUDENT_PERMISSIONS: PermissionAction[] = [
  "exam:list", "exam:read", "exam:take", "exam:auto-save",
  "cheating:report",
  "questionbank:read",
];

// ── Master Permission Map ────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  super_admin: ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,       // legacy alias
  hr: HR_PERMISSIONS,
  engineer: ENGINEER_PERMISSIONS,
  cxo: CXO_PERMISSIONS,
  college_admin: COLLEGE_ADMIN_PERMISSIONS,
  college: COLLEGE_ADMIN_PERMISSIONS, // legacy alias
  college_staff: COLLEGE_STAFF_PERMISSIONS,
  student: STUDENT_PERMISSIONS,
};

// ── Helper: Check if a role has a specific permission ────────────────────────

export function hasPermission(role: string, action: PermissionAction): boolean {
  const normalized = role.toLowerCase();
  const perms = ROLE_PERMISSIONS[normalized];
  if (!perms) return false;
  return perms.includes(action);
}

/**
 * Return all roles that have the given permission.
 * Useful for building authorize() calls dynamically.
 */
export function rolesWithPermission(action: PermissionAction): UserRole[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => perms.includes(action))
    .map(([role]) => role as UserRole);
}

/**
 * Middleware-style permission check. Use with authorize() or standalone.
 * Returns the list of canonical roles that should be passed to authorize().
 */
export function allowedRolesFor(action: PermissionAction): UserRole[] {
  return rolesWithPermission(action);
}
