import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AcademicCapIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PlusIcon,
  SparklesIcon,
  BellAlertIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../stores/authStore";
import api from "../../lib/api";

// ── Data ──────────────────────────────────────────────────────────────────────

const trendData = [
  { month: "Oct", students: 320, hired: 38 },
  { month: "Nov", students: 480, hired: 55 },
  { month: "Dec", students: 210, hired: 28 },
  { month: "Jan", students: 620, hired: 74 },
  { month: "Feb", students: 780, hired: 91 },
  { month: "Mar", students: 550, hired: 66 },
];

const campusData = [
  { name: "IIT Delhi", score: 82, students: 450 },
  { name: "BITS Pilani", score: 78, students: 290 },
  { name: "NIT Trichy", score: 74, students: 380 },
  { name: "VIT Vellore", score: 70, students: 520 },
  { name: "Manipal", score: 68, students: 360 },
];

const ACTIVITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  campus: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
  assessment: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  security: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-400" },
  student: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
};

const ACTIVITY_EMOJI: Record<string, string> = {
  campus: "🏛️", assessment: "📋", security: "🔐", student: "🎓",
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-black/5">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <p className="text-xs text-slate-500">{p.name}:</p>
          <p className="text-xs font-bold text-slate-800">{p.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HRDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const { data } = await api.get("/hr/stats");
      return (data as any).data;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["hr-activity"],
    queryFn: async () => {
      const { data } = await api.get("/hr/activity");
      return (data as any).data as { id: string; text: string; time: string; type: string }[];
    },
  });

  const kpis = [
    {
      label: "Partner Campuses",
      value: stats?.campus_count ?? 6,
      change: "+2 this quarter",
      up: true,
      icon: AcademicCapIcon,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valuColor: "text-blue-700",
    },
    {
      label: "Registered Students",
      value: stats?.student_count ?? 2400,
      change: "+312 this month",
      up: true,
      icon: UsersIcon,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      valuColor: "text-violet-700",
    },
    {
      label: "Active Assessments",
      value: stats?.active_exams ?? 2,
      change: "3 scheduled",
      up: null,
      icon: ClipboardDocumentListIcon,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valuColor: "text-amber-700",
    },
    {
      label: "Overall Pass Ratio",
      value: stats ? `${stats.pass_ratio}%` : "74%",
      change: "+4% from last drive",
      up: true,
      icon: ChartBarIcon,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valuColor: "text-emerald-700",
    },
  ];

  const quickActions = [
    { label: "New Assessment", to: "/app/assessments/blueprint", icon: PlusIcon, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Add Campus", to: "/app/campuses", icon: MapPinIcon, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { label: "Analytics", to: "/app/analytics", icon: ArrowTrendingUpIcon, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "AI Segments", to: "/app/segmentation", icon: SparklesIcon, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Proctoring", to: "/app/proctoring", icon: ShieldCheckIcon, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "Students", to: "/app/students", icon: UsersIcon, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 pb-8">

        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 50%, #FFF7ED 100%)" }}
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-violet-200/30 blur-2xl sm:-left-16 sm:h-48 sm:w-48" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm ring-1 ring-black/5 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Campus Hiring · Season 2025
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Welcome back, {user?.name?.split(" ")[0] ?? "Admin"} 👋
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Your recruitment operations at a glance. Everything you need to run efficient campus hiring drives.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 sm:gap-2.5">
                <Link
                  to="/app/assessments/blueprint"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all hover:shadow-lg sm:px-5 sm:text-sm"
                >
                  <PlusIcon className="h-4 w-4" /> New Drive
                </Link>
                <Link
                  to="/app/campuses"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-black/5 hover:bg-white transition-colors sm:px-5 sm:text-sm"
                >
                  <AcademicCapIcon className="h-4 w-4" /> Campuses
                </Link>
                <Link
                  to="/app/proctoring"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-black/5 hover:bg-white transition-colors sm:px-5 sm:text-sm"
                >
                  <ShieldCheckIcon className="h-4 w-4" /> Proctoring
                </Link>
              </div>
            </div>

            {/* Stat Pills - Hidden on mobile, shown on larger screens */}
            <div className="mt-6 hidden gap-3 lg:flex lg:absolute lg:right-8 lg:top-8 lg:mt-0 lg:flex-col">
              <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Pool</p>
                  <p className="text-lg font-black text-slate-900">{stats?.student_count ?? "2,400"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ChartBarIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pass Ratio</p>
                  <p className="text-lg font-black text-slate-900">{stats ? `${stats.pass_ratio}%` : "74%"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="group flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all sm:gap-4 sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-xl ${k.iconBg} flex items-center justify-center sm:h-11 sm:w-11`}>
                  <k.icon className={`h-5 w-5 ${k.iconColor} sm:h-5.5 sm:w-5.5`} />
                </div>
                {k.up !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.up ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {k.up ? "↑" : "→"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-[11px]">{k.label}</p>
                <p className={`mt-1 text-2xl font-black ${k.valuColor} tabular-nums sm:text-3xl`}>{k.value}</p>
                <p className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">{k.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ─────────────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">

          {/* Area chart */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:rounded-2xl sm:p-6 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">Recruitment Trend</h3>
                <p className="mt-0.5 text-xs text-slate-400">Students screened vs hired — last 6 months</p>
              </div>
              <div className="flex gap-4 text-[10px] text-slate-400 sm:text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Screened
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Hired
                </span>
              </div>
            </div>
            <div className="mt-4 h-48 sm:h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} width={500} height={300} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="students" name="Screened" stroke="#60a5fa" strokeWidth={2.5} fill="url(#colorStudents)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="hired" name="Hired" stroke="#34d399" strokeWidth={2.5} fill="url(#colorHired)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campus scores */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:rounded-2xl sm:p-6">
            <h3 className="text-sm font-bold text-slate-800 sm:text-base">Campus Performance</h3>
            <p className="mt-0.5 text-xs text-slate-400 mb-5">Average assessment scores</p>

            <div className="space-y-3">
              {campusData.map((c, i) => {
                const pct = c.score;
                const barColors = ["bg-blue-400", "bg-violet-400", "bg-teal-400", "bg-amber-400", "bg-rose-400"];
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600 truncate">{c.name}</span>
                      <span className="font-bold text-slate-800 ml-2">{c.score}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${barColors[i % barColors.length]} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <AcademicCapIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700">6 Partner Colleges</p>
                <p className="text-[11px] text-slate-400">Avg score: 74 / 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">

          {/* Recent Activity */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:rounded-2xl sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">Recent Activity</h3>
                <p className="mt-0.5 text-xs text-slate-400">What's happened on the platform</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1">
                <BellAlertIcon className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-[11px] font-bold text-rose-500">{activity.length}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {activity.map((a) => {
                const cfg = ACTIVITY_COLORS[a.type] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
                return (
                  <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${cfg.bg} sm:h-9 sm:w-9`}>
                      {ACTIVITY_EMOJI[a.type] ?? "📌"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{a.text}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {a.type}
                        </span>
                        <span className="text-[11px] text-slate-400">{a.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:rounded-2xl sm:p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1 sm:text-base">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-4">Jump into key workflows</p>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`group flex flex-col items-center justify-center gap-2 rounded-xl border ${action.border} ${action.bg} px-3 py-4 text-center transition-all hover:shadow-md hover:scale-[1.02] active:scale-100`}
                >
                  <div className={`h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* Upcoming Drive */}
            <div
              className="mt-4 rounded-xl p-4 overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)" }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/30 blur-xl" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1 sm:text-[11px]">Next Drive</p>
              <p className="text-sm font-bold text-slate-800">IIT Delhi · Mar 15</p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">450 students eligible</p>
              <Link
                to="/app/campuses"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
              >
                View details <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}