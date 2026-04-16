import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import {
  Plus,
  Search,
  CheckCircle,
  Building2,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Campus {
  id: string;
  name: string;
  city: string;
  state: string;
  tier: string;
  student_count: number;
  admin_count: number;
  assessments_count: number;
  avg_score: number | null;
  avg_risk_score: number | null;
  incident_count: number;
  college_code: string;
  is_active: boolean;
  is_suspended: boolean;
  category?: string;
  institution_type?: string;
  naac_grade?: string;
  created_at: string;
}

type SortKey = "name" | "student_count" | "avg_score" | "incident_count";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 rounded-md bg-slate-100 animate-pulse" style={{ width: `${50 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampusListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // ── Data ───────────────────────────────────────────────────────────────────

  const { data: campuses = [], isLoading } = useQuery<Campus[]>({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return (data as any).data as Campus[];
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
      await api.post("/campuses/bulk-action", { action, campusIds: ids });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      const labels: Record<string, string> = { activate: "Activated", suspend: "Suspended", delete: "Deactivated" };
      toast.success(`${labels[action] ?? "Action"} successfully.`);
      setSelectedIds(new Set());
    },
    onError: () => toast.error("Bulk action failed."),
  });

  // ── Filtering + Sorting ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = campuses.filter((c) => {
      const matchSearch =
        (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (c.city?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (c.college_code?.toLowerCase() || "").includes(search.toLowerCase());

      let matchStatus = true;
      if (statusFilter === "active") matchStatus = c.is_active && !c.is_suspended;
      if (statusFilter === "inactive") matchStatus = !c.is_active;
      if (statusFilter === "suspended") matchStatus = !!c.is_suspended;

      const matchTier = tierFilter === "all" || c.tier === tierFilter;
      return matchSearch && matchStatus && matchTier;
    });

    list = [...list].sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (sortKey === "avg_score") { av = av ?? -1; bv = bv ?? -1; }
      if (sortKey === "name") { av = av?.toLowerCase(); bv = bv?.toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [campuses, search, statusFilter, tierFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, tierFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: campuses.length,
    active: campuses.filter((c) => c.is_active && !c.is_suspended).length,
    suspended: campuses.filter((c) => c.is_suspended).length,
    totalStudents: campuses.reduce((sum, c) => sum + (c.student_count || 0), 0),
    avgIntegrity: campuses.length > 0
      ? Math.min(100, Math.max(0, Math.round(
          100 - (campuses.reduce((sum, c) => sum + (c.avg_risk_score || 0), 0) / campuses.length)
        )))
      : 100,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.size === 0) return;
    const label = action === "delete" ? "deactivate" : action;
    const confirmed = window.confirm(
      `Are you sure you want to ${label} ${selectedIds.size} campus${selectedIds.size > 1 ? "es" : ""}?`
    );
    if (!confirmed) return;
    bulkMutation.mutate({ action, ids: Array.from(selectedIds) });
  };

  const handleSingleAction = (action: string, campus: Campus) => {
    const label = action === "delete" ? "deactivate" : action;
    const confirmed = window.confirm(`Are you sure you want to ${label} "${campus.name}"?`);
    if (!confirmed) return;
    bulkMutation.mutate({ action, ids: [campus.id] });
    setOpenDropdownId(null);
  };

  useEffect(() => {
    const close = () => setOpenDropdownId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-blue-500" />
      : <ArrowDown className="h-3 w-3 text-blue-500" />;
  };

  const getRiskBadge = (campus: Campus) => {
    const risk = campus.avg_risk_score ?? 0;
    if (risk > 50) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"><ShieldAlert className="h-3 w-3" /> High</span>;
    if (risk > 20) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"><AlertTriangle className="h-3 w-3" /> Med</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><ShieldCheck className="h-3 w-3" /> Low</span>;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 50%, #FFF7ED 100%)" }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl sm:-left-16 sm:h-48 sm:w-48" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm ring-1 ring-black/5 sm:text-[11px]">
                  <Building2 className="h-3 w-3" /> Enterprise Network
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Campuses</h1>
                <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                  Manage operations, monitor integrity, and assess performance across all partner institutions.
                </p>
              </div>
              <Link
                to="/app/campuses/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg sm:text-sm"
              >
                <Plus className="h-4 w-4" /> Add Campus
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { label: "Total Campuses", value: stats.total, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Partners", value: stats.active, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Avg Network Integrity", value: `${stats.avgIntegrity}%`, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              {isLoading ? (
                <div className="mt-1 h-6 w-16 rounded bg-slate-100 animate-pulse" />
              ) : (
                <p className={`mt-0.5 text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campuses..."
                  className="w-56 rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
                {(["all", "active", "inactive", "suspended"] as const).map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold capitalize transition-all ${statusFilter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                  >{f}</button>
                ))}
              </div>

              <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
                {["all", "Tier 1", "Tier 2", "Tier 3"].map((t) => (
                  <button key={t} onClick={() => setTierFilter(t)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${tierFilter === t ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                  >{t === "all" ? "All Tiers" : t}</button>
                ))}
              </div>

              {(search || statusFilter !== "all" || tierFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); setTierFilter("all"); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 ring-1 ring-blue-200">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} selected</span>
                <div className="h-4 w-px bg-blue-200" />
                <button onClick={() => handleBulkAction("activate")} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">Activate</button>
                <div className="h-4 w-px bg-blue-200" />
                <button onClick={() => handleBulkAction("suspend")} className="text-xs font-bold text-amber-700 hover:text-amber-800">Suspend</button>
                <div className="h-4 w-px bg-blue-200" />
                <button onClick={() => handleBulkAction("delete")} className="text-xs font-bold text-red-700 hover:text-red-800">Deactivate</button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll} />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      Campus <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Location</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Tier</th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => handleSort("student_count")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      Students <SortIcon col="student_count" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Assessments</th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => handleSort("avg_score")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      Avg Score <SortIcon col="avg_score" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Integrity</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => handleSort("incident_count")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      Risk <SortIcon col="incident_count" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                      No campuses match your filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr
                        className={`border-b border-slate-50 transition-colors hover:bg-slate-50/60 cursor-pointer ${expandedRows.has(c.id) ? "bg-slate-50/40" : ""}`}
                        onClick={() => navigate(`/app/campuses/${c.id}`)}
                      >
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600"
                            checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleExpand(c.id, e)}
                              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {expandedRows.has(c.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <div>
                              <p className="text-sm font-bold text-slate-800 max-w-[180px] truncate">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.college_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          <span className="truncate block max-w-[120px]">{c.city}, {c.state}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.tier === "Tier 1" ? "bg-amber-50 text-amber-700" : c.tier === "Tier 2" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                            {c.tier || "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                          {(c.student_count || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-700">
                          {(c.assessments_count || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                          {c.avg_score != null ? `${c.avg_score.toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                          {c.avg_risk_score != null
                            ? `${Math.min(100, Math.max(0, Math.round(100 - c.avg_risk_score)))}%`
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.is_suspended ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Suspended</span>
                          ) : c.is_active ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {getRiskBadge(c)}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === c.id ? null : c.id); }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openDropdownId === c.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5">
                                <Link
                                  to={`/app/campuses/${c.id}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="h-4 w-4" /> Deep View
                                </Link>
                                <Link
                                  to={`/app/campuses/${c.id}/edit`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Edit Parameters
                                </Link>
                                {c.is_active && !c.is_suspended ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSingleAction("suspend", c); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSingleAction("activate", c); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSingleAction("delete", c); }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  Deactivate
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedRows.has(c.id) && (
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <td colSpan={11} className="px-14 py-4">
                            <div className="grid grid-cols-4 gap-4 rounded-xl ring-1 ring-slate-200/50 bg-white p-4 text-xs">
                              <div>
                                <p className="text-slate-400 mb-1">Assigned Admins</p>
                                <p className="font-bold text-slate-700">{c.admin_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Classification</p>
                                <p className="font-bold text-slate-700">{c.category || "General"} · {c.naac_grade ? `NAAC ${c.naac_grade}` : "Unrated"}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Incidents Flagged</p>
                                <p className="font-bold text-red-600">{c.incident_count || 0}</p>
                              </div>
                              <div className="flex items-center">
                                <Link
                                  to={`/app/campuses/${c.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Full Campus Overview <Eye className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} campuses
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-colors ${page === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
