import { useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { authActions, useAuthStore } from "../stores/authStore";
import { resolveRole, type AppRole } from "../components/ProtectedRoute";
import Logo from "../components/Logo";
import NotificationBell from "../components/NotificationBell";
import api from "../lib/api";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  EyeIcon,
  ChartBarIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserGroupIcon,
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
    href: "/app/hr-dashboard",
    icon: HomeIcon,
    roles: ["super_admin", "hr", "cxo"],
  },
  {
    name: "CXO Analytics",
    href: "/app/cxo-analytics",
    icon: ChartBarIcon,
    roles: ["cxo", "super_admin"],
  },
  {
    name: "Campuses",
    href: "/app/campuses",
    icon: AcademicCapIcon,
    roles: ["super_admin", "hr"],
  },
  {
    name: "Engineer Panel",
    href: "/app/engineer-panel",
    icon: WrenchScrewdriverIcon,
    roles: ["engineer"],
  },
  {
    name: "Student Portal",
    href: "/app/student-portal",
    icon: HomeIcon,
    roles: ["student"],
  },
  {
    name: "Exams",
    href: "/app/student-portal?tab=exams",
    icon: AcademicCapIcon,
    roles: ["student"],
  },
  {
    name: "Learning",
    href: "/app/student-portal?tab=learning",
    icon: ClipboardDocumentListIcon,
    roles: ["student"],
  },

  // College / Campus Portal navigation
  {
    name: "Dashboard",
    href: "/app/college-dashboard",
    icon: HomeIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Students",
    href: "/app/students",
    icon: UsersIcon,
    roles: ["super_admin", "hr", "cxo", "college_admin", "college", "college_staff"],
  },
  {
    name: "Drives",
    href: "/app/drives",
    icon: RocketLaunchIcon,
    roles: ["super_admin", "hr", "engineer"],
  },
  {
    name: "Drives",
    href: "/app/college/drives",
    icon: RocketLaunchIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Results",
    href: "/app/college/results",
    icon: ClipboardDocumentListIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Insights",
    href: "/app/college/insights",
    icon: ChartBarIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Integrity",
    href: "/app/college/integrity",
    icon: ShieldCheckIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Communications",
    href: "/app/college/communications",
    icon: EnvelopeIcon,
    roles: ["college_admin", "college", "college_staff"],
  },
  {
    name: "Campus Admins",
    href: "/app/college/campus-admins",
    icon: UserGroupIcon,
    roles: ["college_admin", "college"],
  },
  {
    name: "Settings",
    href: "/app/college/settings",
    icon: Cog6ToothIcon,
    roles: ["college_admin", "college"],
  },

  // ── Skill Development Layer ──────────────────────────────────────────────────
  {
    name: "Skills",
    href: "/app/skills",
    icon: AcademicCapIcon,
    roles: ["super_admin", "hr", "cxo"],
  },
  {
    name: "Learning Modules",
    href: "/app/learning-modules",
    icon: ClipboardDocumentListIcon,
    roles: ["super_admin", "hr", "cxo"],
  },
  {
    name: "Skill Programs",
    href: "/app/skill-programs",
    icon: RocketLaunchIcon,
    roles: ["super_admin", "hr", "cxo"],
  },
  {
    name: "Skill Partners",
    href: "/app/skill-partners",
    icon: UserGroupIcon,
    roles: ["super_admin", "hr", "cxo"],
  },

  // Other Feature links
  {
    name: "Assessment Rules",
    href: "/app/assessment-rules",
    icon: ClipboardDocumentListIcon,
    roles: ["super_admin", "hr", "engineer"],
  },
  {
    name: "Live Monitoring",
    href: "/app/admin/monitoring",
    icon: EyeIcon,
    roles: ["super_admin"],
  },
  {
    name: "Administration",
    href: "/app/administration",
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

  // Refresh user profile on mount to pick up college_name and any server-side changes
  useEffect(() => {
    const isCollegeRole = ["college", "college_admin", "college_staff"].includes(user?.role ?? "");
    if (isCollegeRole && user && !user.college_name) {
      api.get("/auth/me").then(({ data }) => {
        const me = data.data;
        if (me?.college_name) {
          authActions.setUser({ ...user, college_name: me.college_name });
        }
      }).catch(() => { /* silent */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter navigation items to only those the user's role can see
  const visibleNav = navigation.filter((item) =>
    item.roles.includes(effectiveRole),
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-white border-r border-slate-200">
        {/* Brand */}
        <div className="flex h-20 flex-shrink-0 items-center gap-3 px-6 border-b border-slate-100">
          <Logo size={28} />
          <div className="min-w-0 flex-1">
            <span className="block text-xl font-black tracking-tight text-slate-900">GradLogic</span>
            {user?.college_name && (
              <span className="block truncate text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                {user.college_name}
              </span>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 px-4 py-6">
          {visibleNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${isActive
                  ? "bg-[#F0F5FF] text-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2 : 1.5} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}

        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="mb-2 bg-slate-50 rounded-2xl p-4 shadow-sm border border-slate-100">
            {user && (
              <div className="mb-4">
                <p className="truncate text-sm font-black text-slate-900">{user.name}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
                {user.college_name && (
                  <p className="truncate text-[10px] font-semibold text-indigo-500 mt-0.5">
                    🏫 {user.college_name}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => authActions.logout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-end px-8 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <NotificationBell />
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
