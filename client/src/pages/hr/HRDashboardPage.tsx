import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "../../stores/authStore";
import api from "../../lib/api";
import {
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  Plus,
  MapPin,
  Sparkles,
  Shield,
  ArrowRight,
  RefreshCw,
  Trophy,
  Star,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HRStats {
  campus_count: number;
  student_count: number;
  active_exams: number;
  critical_violations: number;
  pass_ratio: number;
  avg_score: number;
  new_students_this_month: number;
}

interface TrendPoint {
  month: string;
  students: number;
  screened: number;
}

interface Campus {
  id: string;
  name: string;
  avg_score: number;
  student_count: number;
  incident_count: number;
}

interface Activity {
  id: string;
  text: string;
  time: string;
  type: string;
}

interface Exam {
  id: string;
  title: string;
  is_active: boolean;
  duration_minutes: number;
  total_marks: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTIVITY_CFG: Record<string, { bg: string; text: string; icon: string }> = {
  campus:     { bg: "bg-violet-50",  text: "text-violet-600",  icon: "🏛️" },
  assessment: { bg: "bg-blue-50",    text: "text-blue-600",    icon: "📋" },
  security:   { bg: "bg-rose-50",    text: "text-rose-600",    icon: "🔐" },
  student:    { bg: "bg-emerald-50", text: "text-emerald-600", icon: "🎓" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-xl ring-1 ring-black/5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <p className="text-xs text-slate-500">{p.name}:</p>
          <p className="text-xs font-bold text-slate-800">{p.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded-lg bg-slate-100 animate-pulse`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HRDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isFetching: statsFetching } = useQuery<HRStats>({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const { data } = await api.get("/hr/stats");
      return (data as any).data;
    },
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery<TrendPoint[]>({
    queryKey: ["hr-trend"],
    queryFn: async () => {
      const { data } = await api.get("/hr/trend");
      return (data as any).data as TrendPoint[];
    },
  });

  const { data: campuses = [], isLoading: campusesLoading } = useQuery<Campus[]>({
    queryKey: ["campuses-list"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return (data as any).data as Campus[];
    },
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<Activity[]>({
    queryKey: ["hr-activity"],
    queryFn: async () => {
      const { data } = await api.get("/hr/activity");
      return (data as any).data as Activity[];
    },
    refetchInterval: 30000,
  });

  const { data: activeExams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["exams-active"],
    queryFn: async () => {
      const { data } = await api.get("/exams/active");
      return (data as any).data as Exam[];
    },
  });

  // Top 5 campuses by avg_score
  const topCampuses = [...campuses]
    .sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))
    .slice(0, 5);

  const maxCampusScore = topCampuses[0]?.avg_score || 100;

  const kpis = [
    {
      label: "Partner Campuses",
      value: stats?.campus_count,
      sub: `${campuses.filter(c => (c.student_count ?? 0) > 0).length} active`,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      badge: null,
    },
    {
      label: "Registered Students",
      value: stats?.student_count?.toLocaleString(),
      sub: stats?.new_students_this_month != null
        ? `+${stats.new_students_this_month} this month`
        : null,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      badge: "up",
    },
    {
      label: "Active Assessments",
      value: stats?.active_exams,
      sub: activeExams.length > 0 ? `${activeExams.length} live now` : "None running",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      badge: null,
    },
    {
      label: "Pass Ratio",
      value: stats?.pass_ratio != null ? `${stats.pass_ratio}%` : null,
      sub: stats?.avg_score != null ? `Avg score ${stats.avg_score}` : null,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      badge: "up",
    },
    {
      label: "Critical Violations",
      value: stats?.critical_violations,
      sub: "Risk score ≥ 70",
      icon: ShieldAlert,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      badge: (stats?.critical_violations ?? 0) > 0 ? "warn" : null,
    },
  ];

  const quickActions = [
    { label: "New Assessment", to: "/app/assessments/blueprint", icon: Plus, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Add Campus", to: "/app/campuses", icon: MapPin, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { label: "Analytics", to: "/app/analytics", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "AI Segments", to: "/app/segmentation", icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Live Monitoring", to: "/app/admin/monitoring", icon: Shield, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "Students", to: "/app/students", icon: Users, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.name?.split(" ")[0] ?? "—"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Your campus hiring operations at a glance.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => refetchStats()}
              disabled={statsFetching}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statsFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              to="/app/assessments/blueprint"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> New Drive
            </Link>
            <Link
              to="/app/admin/monitoring"
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all"
            >
              <Shield className="h-3.5 w-3.5" /> Live Monitoring
            </Link>
          </div>
        </div>

        {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div
              key={k.label}
              className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all ${k.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-4.5 w-4.5 ${k.color}`} style={{ width: 18, height: 18 }} />
                </div>
                {k.badge === "up" && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">↑</span>
                )}
                {k.badge === "warn" && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 animate-pulse">!</span>
                )}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
              {statsLoading ? (
                <div className="space-y-1.5">
                  <SkeletonLine h="h-7" w="w-16" />
                  <SkeletonLine h="h-3" w="w-20" />
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-black tabular-nums ${k.color} sm:text-3xl`}>
                    {k.value ?? "—"}
                  </p>
                  {k.sub && <p className="mt-0.5 text-[10px] text-slate-400">{k.sub}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts Row ──────────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">

          {/* Trend Chart */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">Recruitment Trend</h3>
                <p className="mt-0.5 text-xs text-slate-400">Students registered vs screened in assessments — last 6 months</p>
              </div>
              <div className="flex gap-4 text-[10px] text-slate-400 sm:text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Registered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-400" /> Screened
                </span>
              </div>
            </div>

            <div className="mt-4 h-48 sm:h-56 lg:h-64">
              {trendLoading ? (
                <div className="h-full flex items-end gap-2 px-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                      <div className="w-full bg-slate-100 animate-pulse rounded" style={{ height: `${30 + (i * 11)}%` }} />
                    </div>
                  ))}
                </div>
              ) : trend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No trend data available yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRegistered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradScreened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="students" name="Registered" stroke="#60a5fa" strokeWidth={2.5} fill="url(#gradRegistered)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="screened" name="Screened" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gradScreened)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Campus Performance */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800 sm:text-base">Campus Performance</h3>
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 mb-5">Top campuses by avg. assessment score</p>

            {campusesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <SkeletonLine w="w-28" h="h-3" />
                      <SkeletonLine w="w-8" h="h-3" />
                    </div>
                    <SkeletonLine h="h-1.5" />
                  </div>
                ))}
              </div>
            ) : topCampuses.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No campus data yet</p>
            ) : (
              <div className="space-y-3.5">
                {topCampuses.map((c, i) => {
                  const pct = maxCampusScore > 0 ? (c.avg_score / maxCampusScore) * 100 : 0;
                  const barColors = ["bg-blue-500", "bg-violet-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {i === 0 && <Star className="h-3 w-3 text-amber-400 shrink-0" />}
                          <span className="font-semibold text-slate-700 truncate">{c.name}</span>
                        </div>
                        <span className="font-black text-slate-900 ml-2 tabular-nums">
                          {c.avg_score != null ? Math.round(c.avg_score) : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${barColors[i % barColors.length]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">{c.student_count ?? 0} students</p>
                    </div>
                  );
                })}
              </div>
            )}

            {!campusesLoading && campuses.length > 0 && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">{campuses.length} Partner Colleges</p>
                  <p className="text-[11px] text-slate-400">
                    {campuses.length > 0 && stats?.avg_score != null
                      ? `Platform avg: ${stats.avg_score}`
                      : "Scores loading…"}
                  </p>
                </div>
                <Link to="/app/campuses" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">Recent Activity</h3>
                <p className="mt-0.5 text-xs text-slate-400">Latest platform events</p>
              </div>
              {activity.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {activity.length}
                </span>
              )}
            </div>

            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <SkeletonLine w="w-8 shrink-0" h="h-8 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <SkeletonLine h="h-4" />
                      <SkeletonLine w="w-24" h="h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No recent activity</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {activity.slice(0, 8).map((a) => {
                  const cfg = ACTIVITY_CFG[a.type] ?? { bg: "bg-slate-100", text: "text-slate-600", icon: "📌" };
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm ${cfg.bg}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug truncate">{a.text}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {a.type}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {typeof a.time === "string" && /^\d{4}/.test(a.time)
                              ? formatRelativeTime(a.time)
                              : a.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Quick Actions + Active Assessments */}
          <div className="flex flex-col gap-4">

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1 sm:text-base">Quick Actions</h3>
              <p className="text-xs text-slate-400 mb-4">Jump into key workflows</p>

              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border ${action.border} ${action.bg} px-2 py-3 text-center transition-all hover:shadow-md hover:scale-[1.02] active:scale-100`}
                  >
                    <div className={`h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Assessments */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">Active Assessments</h3>
                <Link to="/app/assessments" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {examsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-1.5">
                      <SkeletonLine h="h-3.5" />
                      <SkeletonLine w="w-24" h="h-3" />
                    </div>
                  ))}
                </div>
              ) : activeExams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">No active assessments</p>
                  <Link
                    to="/app/assessments/blueprint"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create one
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeExams.slice(0, 4).map((exam) => (
                    <Link
                      key={exam.id}
                      to={`/app/assessments/${exam.id}`}
                      className="block rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                    >
                      <p className="text-xs font-bold text-slate-800 truncate">{exam.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {exam.duration_minutes}min · {exam.total_marks} marks
                      </p>
                    </Link>
                  ))}
                  {activeExams.length > 4 && (
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      +{activeExams.length - 4} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
