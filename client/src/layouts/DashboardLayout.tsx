import { Outlet, NavLink, Link } from "react-router-dom";
import { authActions, useAuthStore } from "../stores/authStore";
import { resolveRole, type AppRole } from "../components/ProtectedRoute";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CpuChipIcon,
  BuildingLibraryIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline";

// ── Sidebar navigation items with role access control ────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string }>;
  roles: AppRole[]; // which roles see this link
}

const navigation: NavItem[] = [
  // Role-specific home pages
  {
    name: "HR Dashboard",
    href: "/hr-dashboard",
    icon: HomeIcon,
    roles: ["super_admin", "hr", "cxo"],
  },
  {
    name: "Campuses",
    href: "/campuses",
    icon: AcademicCapIcon,
    roles: ["super_admin", "hr"],
  },
  {
    name: "Engineer Panel",
    href: "/engineer-panel",
    icon: WrenchScrewdriverIcon,
    roles: ["engineer"],
  },
  {
    name: "CXO Analytics",
    href: "/cxo-analytics",
    icon: PresentationChartBarIcon,
    roles: ["cxo", "super_admin"],
  },
  {
    name: "College Dashboard",
    href: "/college-dashboard",
    icon: AcademicCapIcon,
    roles: ["college_admin", "college_staff"],
  },
  {
    name: "Student Portal",
    href: "/student-portal",
    icon: HomeIcon,
    roles: ["student"],
  },

  // Feature links
  {
    name: "Students",
    href: "/students",
    icon: UsersIcon,
    roles: ["super_admin", "hr", "cxo", "college_admin"],
  },
  {
    name: "Assessments",
    href: "/assessments",
    icon: ClipboardDocumentListIcon,
    roles: ["super_admin", "hr", "college_admin", "engineer"],
  },
  {
    name: "Segmentation",
    href: "/segmentation",
    icon: CpuChipIcon,
    roles: ["super_admin", "hr"],
  },
  {
    name: "Proctoring",
    href: "/proctoring",
    icon: ShieldCheckIcon,
    roles: ["super_admin", "hr", "engineer", "college_admin"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: ChartBarIcon,
    roles: ["super_admin", "hr", "cxo", "engineer"],
  },
  {
    name: "Administration",
    href: "/administration",
    icon: WrenchScrewdriverIcon,
    roles: ["super_admin", "admin", "hr", "cxo"],
  },
];

// ── Formatted role label ─────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr: "HR",
  engineer: "Engineer",
  cxo: "CXO",
  college_admin: "College Admin",
  college: "College",
  college_staff: "College Staff",
  student: "Student",
};

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const effectiveRole = resolveRole(user?.role ?? "student");

  // Filter navigation items to only those the user's role can see
  const visibleNav = navigation.filter((item) =>
    item.roles.includes(effectiveRole),
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-primary-950">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6">
          <BuildingLibraryIcon className="h-8 w-8 text-primary-400" />
          <span className="text-lg font-bold text-white">TalentSecure</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? "bg-primary-800 text-white"
                  : "text-primary-300 hover:bg-primary-900 hover:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}

          {/* Quick link: Student Registration (only for admin / hr / college_admin) */}
          {["super_admin", "hr", "college_admin"].includes(effectiveRole) && (
            <div className="mt-4 border-t border-primary-800 pt-4">
              <Link
                to="/register-student"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-300 hover:bg-primary-900 hover:text-white transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 flex-shrink-0" />
                Register Student
              </Link>
            </div>
          )}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-primary-800 p-3">
          {user && (
            <div className="mb-2 px-3 py-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-primary-400">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          )}
          <button
            onClick={() => authActions.logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-300 hover:bg-primary-900 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
