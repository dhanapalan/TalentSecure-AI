import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type AuthUser } from "../stores/authStore";

// ── Canonical role type (matches server UserRole) ────────────────────────────

export type AppRole =
  | "super_admin"
  | "admin"
  | "hr"
  | "engineer"
  | "cxo"
  | "college_admin"
  | "college"
  | "college_staff"
  | "student";

// Legacy roles map to their canonical equivalents
const ROLE_ALIASES: Record<string, AppRole> = {
  admin: "super_admin",
  college: "college_admin",
};

/** Resolve a possibly-legacy role to a canonical one. */
export function resolveRole(raw: string): AppRole {
  const normalized = raw.toLowerCase();
  return (ROLE_ALIASES[normalized] ?? normalized) as AppRole;
}

/** Default landing path per role after login. */
export const ROLE_HOME: Record<AppRole, string> = {
  super_admin: "/hr-dashboard",
  admin: "/hr-dashboard",
  hr: "/hr-dashboard",
  engineer: "/engineer-panel",
  cxo: "/cxo-analytics",
  college_admin: "/college-dashboard",
  college: "/college-dashboard",
  college_staff: "/college-dashboard",
  student: "/student-portal",
};

/** Get the correct landing path for a user. */
export function getLandingPath(user: AuthUser | null): string {
  if (!user) return "/auth/login";

  // Students must complete onboarding first
  if (
    resolveRole(user.role) === "student" &&
    user.is_profile_complete === false
  ) {
    return "/student-onboarding";
  }

  return ROLE_HOME[resolveRole(user.role)] ?? "/";
}

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — requires authentication
// ─────────────────────────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Student onboarding gate (unchanged from original logic)
  if (location.pathname === "/student-onboarding" && resolveRole(user?.role ?? "") !== "student") {
    return <Navigate to={getLandingPath(user)} replace />;
  }

  if (
    resolveRole(user?.role ?? "") === "student" &&
    user?.is_profile_complete === false &&
    location.pathname !== "/student-onboarding"
  ) {
    return <Navigate to="/student-onboarding" replace />;
  }

  if (
    resolveRole(user?.role ?? "") === "student" &&
    user?.is_profile_complete === true &&
    location.pathname === "/student-onboarding"
  ) {
    return <Navigate to="/student-portal" replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleGuard — restricts a route to a set of allowed roles
// ─────────────────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  /** Canonical roles allowed to render this route. */
  allowed: AppRole[];
  children: React.ReactNode;
}

/**
 * Wraps child routes and redirects to /not-authorized if the user's role
 * (after alias resolution) is not in the `allowed` list.
 */
export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const effective = resolveRole(user.role);

  if (!allowed.includes(effective)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}
