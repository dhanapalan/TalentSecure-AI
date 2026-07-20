import { LOGIN_ROLES, type LoginRoleId } from "./loginRoles";

/**
 * Per-subdomain portal configuration.
 *
 * nginx already serves every subdomain from the same SPA bundle (one
 * server_name block proxying to :3000), so the portal a visitor is in is
 * determined client-side from the hostname rather than by a separate build.
 *
 * Narrowing the role list per portal is the point: a student on exam.* never
 * sees "Super Admin", and single-role portals hide the selector entirely.
 */
export type LoginPortal = {
  id: string;
  /** Shown in the heading, e.g. "Campus Portal". Null on the main domain. */
  name: string | null;
  /** Roles offered here. A single entry hides the role selector. */
  roles: LoginRoleId[];
  /** Sub-heading shown under "Welcome back" when the portal is branded. */
  tagline?: string;
};

const ALL_ROLES = LOGIN_ROLES.map((r) => r.id);

/**
 * Matched by hostname prefix so it works across environments: the same rule
 * covers exam.gradlogic.atherasys.com and any future exam.<other-domain>.
 */
const PORTALS: Array<{ prefix: string; portal: LoginPortal }> = [
  {
    prefix: "exam.",
    portal: {
      id: "exam",
      name: "Student Portal",
      roles: ["student"],
      tagline: "Learn, practice, assessments & readiness",
    },
  },
  {
    prefix: "campus.",
    portal: {
      id: "campus",
      name: "Campus Portal",
      roles: ["college", "faculty"],
      tagline: "Campaigns, students, faculty & placement cell",
    },
  },
  {
    prefix: "admin.",
    portal: {
      id: "admin",
      name: "Admin Portal",
      roles: ["platform_admin", "super_admin"],
      tagline: "Platform operations & administration",
    },
  },
];

/** Main domain and local dev: every role, unchanged from today's behaviour. */
const DEFAULT_PORTAL: LoginPortal = {
  id: "main",
  name: null,
  roles: ALL_ROLES,
};

export function resolveLoginPortal(hostname?: string): LoginPortal {
  const host = (hostname ?? window.location.hostname).toLowerCase();
  const match = PORTALS.find((p) => host.startsWith(p.prefix));
  return match ? match.portal : DEFAULT_PORTAL;
}

/**
 * Roles a portal offers, in the order the portal declares them — the first
 * entry becomes the default selection, so campus.* leads with College Admin
 * rather than whichever role happens to come first in LOGIN_ROLES.
 *
 * Falls back to every role if a portal lists none that still exist, so a typo
 * in the config can never render a login page with no way in.
 */
export function portalRoles(portal: LoginPortal) {
  const allowed = portal.roles
    .map((id) => LOGIN_ROLES.find((r) => r.id === id))
    .filter((r): r is (typeof LOGIN_ROLES)[number] => Boolean(r));
  return allowed.length ? allowed : LOGIN_ROLES;
}
