import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Plus, Search, Users, GraduationCap, Eye, Edit2, Filter, AlertTriangle, Shield, ShieldCheck, ShieldAlert, Briefcase, CheckCircle, XCircle, BarChart2, Activity, Tags, CheckSquare, Calendar } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/authStore";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CampusStudent {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  student_id: string;
  roll_number: string;
  passing_year: number;
  department: string;
  degree: string;
  cgpa: number;
  avatar?: string;
  avg_score: number;
  avg_integrity: number;
  placement_status: PlacementStatus;
  risk_level: RiskLevel;
}

type PlacementStatus = "Not Shortlisted" | "Shortlisted" | "Interviewed" | "Offered" | "Joined";
type RiskLevel = "Low" | "Medium" | "High";

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  avgScore: number;
  avgIntegrity: number;
  appearedInLatestDrive: number;
  placedPipelineCount: number;
  highRiskCount: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Score Color Helper ────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50";
  if (score >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function scoreIcon(score: number) {
  if (score >= 80) return <ShieldCheck className="h-3 w-3" />;
  if (score >= 60) return <Shield className="h-3 w-3" />;
  return <ShieldAlert className="h-3 w-3" />;
}

function riskBadge(level: RiskLevel) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold";
  if (level === "High") return `${base} bg-red-100 text-red-700`;
  if (level === "Medium") return `${base} bg-amber-100 text-amber-700`;
  return `${base} bg-emerald-100 text-emerald-700`;
}

function placementBadge(status: PlacementStatus) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold";
  if (status === "Joined") return `${base} bg-violet-100 text-violet-700`;
  if (status === "Offered") return `${base} bg-blue-100 text-blue-700`;
  if (status === "Interviewed") return `${base} bg-cyan-100 text-cyan-700`;
  if (status === "Shortlisted") return `${base} bg-indigo-100 text-indigo-700`;
  return `${base} bg-slate-100 text-slate-500`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow ${sizeClass}`}>
      {initials}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-black tabular-nums text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StudentListPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isCollegeRole = ["college_admin", "college", "college_staff"].includes(user?.role ?? "");

  // ── State ─────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [placementFilter, setPlacementFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  // Build filters object for query key so it re-fetches when filters change
  const filters = { page, search, year, department, placementFilter, riskFilter, statusFilter };

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const studentsEndpoint = isCollegeRole ? "/campus/students" : "/students";
  const analyticsEndpoint = isCollegeRole ? "/campus/students/analytics" : "/students/analytics";

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["campus-students", filters],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(year && { year }),
        ...(department && { department }),
        ...(placementFilter && { placementStatus: placementFilter }),
        ...(riskFilter && { riskLevel: riskFilter }),
        ...(statusFilter && { status: statusFilter }),
      };
      const { data } = await api.get(studentsEndpoint, { params });
      return data as { data: CampusStudent[]; pagination: PaginationData };
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["campus-students-analytics"],
    queryFn: async () => {
      const { data } = await api.get(analyticsEndpoint);
      return (data as any).data as AnalyticsData;
    },
  });

  const students = studentsData?.data ?? [];
  const pagination = studentsData?.pagination;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const bulkMutation = useMutation({
    mutationFn: async ({ action, studentIds, payload }: any) => {
      await api.post("/campus/students/bulk-action", { action, studentIds: [...studentIds], payload });
    },
    onSuccess: () => {
      toast.success("Bulk action applied successfully");
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["campus-students"] });
    },
    onError: () => toast.error("Bulk action failed"),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(students.map((s) => s.user_id)));
    else setSelected(new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const handleBulkAction = useCallback(() => {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === "suspend") {
      bulkMutation.mutate({ action: "suspend", studentIds: selected });
    } else if (bulkAction.startsWith("placement:")) {
      bulkMutation.mutate({
        action: "update_placement",
        studentIds: selected,
        payload: { placement_status: bulkAction.replace("placement:", "") },
      });
    } else if (bulkAction === "export") {
      toast.success("Exporting selected students...");
    }
    setBulkAction("");
  }, [bulkAction, selected]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 p-6 sm:p-8 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-36 w-36 rounded-full bg-purple-400/30 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm">
                <GraduationCap className="h-3.5 w-3.5" />
                Campus Portal
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">Students</h1>
              <p className="text-sm text-indigo-200">
                Manage student profiles, track performance and placement readiness.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toast.success("Tags management coming soon!")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30"
              >
                <Tags className="h-4 w-4" /> Manage Tags
              </button>
              <Link
                to="/app/students/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" /> Add Student
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <KPICard label="Total Students" value={analyticsData?.totalStudents ?? "—"} icon={Users} color="bg-indigo-100 text-indigo-600" />
          <KPICard label="Active Students" value={analyticsData?.activeStudents ?? "—"} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
          <KPICard label="Latest Drive" value={analyticsData?.appearedInLatestDrive ?? "—"} sub="students appeared" icon={Calendar} color="bg-violet-100 text-violet-600" />
          <KPICard
            label="Avg Score"
            value={analyticsData?.avgScore !== undefined ? `${analyticsData.avgScore}%` : "—"}
            sub="across all drives"
            icon={BarChart2}
            color="bg-blue-100 text-blue-600"
          />
          <KPICard
            label="Avg Integrity"
            value={analyticsData?.avgIntegrity !== undefined ? `${analyticsData.avgIntegrity}%` : "—"}
            sub={`${analyticsData?.highRiskCount ?? 0} high risk`}
            icon={Activity}
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, roll no, email…"
                aria-label="Search students"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {/* Basic Filters */}
            <select value={placementFilter} onChange={(e) => { setPlacementFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" aria-label="Placement Status">
              <option value="">Placement Status</option>
              <option>Not Shortlisted</option>
              <option>Shortlisted</option>
              <option>Interviewed</option>
              <option>Offered</option>
              <option>Joined</option>
            </select>
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" aria-label="Risk Level">
              <option value="">Risk Level</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" aria-label="Status">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${showAdvanced ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Advanced
            </button>
          </div>
          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" aria-label="Graduation Year">
                <option value="">Graduation Year</option>
                {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
              </select>
              <input
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                placeholder="Department / Specialization"
                aria-label="Department or Specialization"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
        </div>

        {/* ── Bulk Action Bar ──────────────────────────────────────────────── */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-5 py-3 shadow-lg">
            <CheckSquare className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm focus:outline-none"
                aria-label="Bulk Action"
              >
                <option value="">Choose Action…</option>
                <option value="suspend">Suspend Selected</option>
                <option value="export">Export Selected</option>
                <option value="placement:Shortlisted">Mark as Shortlisted</option>
                <option value="placement:Offered">Mark as Offered</option>
                <option value="placement:Joined">Mark as Joined</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || bulkMutation.isPending}
                className="rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-indigo-700 shadow disabled:opacity-50 hover:bg-indigo-50 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* ── Students Table ───────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                <p className="text-sm text-slate-500">Loading students…</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No students found</p>
                <p className="mb-4 text-xs text-slate-400">Try adjusting your search or filters</p>
                <Link to="/app/students/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                  <Plus className="h-4 w-4" /> Add First Student
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selected.size === students.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        aria-label="Select all students"
                        title="Select all students"
                      />
                    </th>
                    {["Student", "Roll No", "Dept / Year", "CGPA", "Avg Score", "Integrity", "Placement", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.user_id}
                      className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/30 ${selected.has(s.user_id) ? "bg-indigo-50/60" : ""}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(s.user_id)}
                          onChange={(e) => handleSelectOne(s.user_id, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          aria-label={`Select student ${s.name}`}
                          title={`Select student ${s.name}`}
                        />
                      </td>
                      {/* Name + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <div className="min-w-0">
                            <Link to={`/app/students/${s.user_id}`} className="block truncate text-xs font-semibold text-slate-800 hover:text-indigo-600 hover:underline">
                              {s.name}
                            </Link>
                            <p className="truncate text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Roll No */}
                      <td className="px-4 py-3 text-xs text-slate-600">{s.roll_number || "—"}</td>
                      {/* Dept / Year */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-700">{s.department || "—"}</p>
                        <p className="text-[11px] text-slate-400">{s.passing_year}</p>
                      </td>
                      {/* CGPA */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${s.cgpa >= 9 ? "text-emerald-600" : s.cgpa >= 7.5 ? "text-blue-600" : "text-amber-600"}`}>
                          {s.cgpa?.toFixed(1) ?? "—"}
                        </span>
                      </td>
                      {/* Avg Score */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor(s.avg_score)}`}>
                          {scoreIcon(s.avg_score)}
                          {s.avg_score?.toFixed(0)}%
                        </span>
                      </td>
                      {/* Integrity */}
                      <td className="px-4 py-3">
                        <span className={riskBadge(s.risk_level)}>
                          {s.risk_level === "High" ? <AlertTriangle className="h-3 w-3" /> :
                            s.risk_level === "Medium" ? <Shield className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {s.risk_level} Risk
                        </span>
                      </td>
                      {/* Placement */}
                      <td className="px-4 py-3">
                        <span className={placementBadge(s.placement_status)}>
                          <Briefcase className="mr-1 inline h-2.5 w-2.5" />
                          {s.placement_status}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {s.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/app/students/${s.user_id}`}
                            className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/app/students/${s.user_id}/edit`}
                            className="inline-flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of{" "}
              <span className="font-bold text-slate-700">{pagination.total}</span> students
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${page === p ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}