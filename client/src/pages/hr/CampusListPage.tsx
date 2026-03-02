import React, { useState, useEffect } from "react";
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
  avg_score: number;
  avg_risk_score: number;
  incident_count: number;
  college_code: string;
  is_active: boolean;
  is_suspended: boolean;
  category?: string;
  institution_type?: string;
  naac_grade?: string;
  created_at: string;
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

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const { data: campuses = [] } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Bulk action completed.");
      setSelectedIds(new Set());
    },
    onError: () => {
      toast.error("Bulk action failed.");
    },
  });

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filtered = campuses.filter((c) => {
    const matchSearch =
      (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.city?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.college_code?.toLowerCase() || "").includes(search.toLowerCase());

    let matchStatus = true;
    if (statusFilter === "active") matchStatus = c.is_active && !c.is_suspended;
    if (statusFilter === "inactive") matchStatus = !c.is_active;
    if (statusFilter === "suspended") matchStatus = c.is_suspended;

    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchStatus && matchTier;
  });

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: campuses.length,
    active: campuses.filter((c) => c.is_active && !c.is_suspended).length,
    suspended: campuses.filter((c) => c.is_suspended).length,
    totalStudents: campuses.reduce((sum, c) => sum + c.student_count, 0),
    avgIntegrity: campuses.length > 0
      ? (100 - (campuses.reduce((sum, c) => sum + (c.avg_risk_score || 0), 0) / campuses.length)).toFixed(1)
      : "100",
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate({ action, ids: Array.from(selectedIds) });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getRiskBadge = (campus: Campus) => {
    const risk = campus.avg_risk_score;
    // Lower risk score = better integrity. Assume > 50 is critical, > 20 moderate, else low
    if (risk > 50) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"><ShieldAlert className="h-3 w-3" /> High</span>;
    if (risk > 20) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"><AlertTriangle className="h-3 w-3" /> Med</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><ShieldCheck className="h-3 w-3" /> Low</span>;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 50%, #FFF7ED 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl sm:-left-16 sm:h-48 sm:w-48" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm ring-1 ring-black/5 sm:text-[11px]">
                  <Building2 className="h-3 w-3" />
                  Enterprise Network
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Campuses
                </h1>
                <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                  Manage operations, monitor integrity, and assess performance across all partner institutions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/app/campuses/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg sm:text-sm"
                >
                  <Plus className="h-4 w-4" /> Add Campus
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-slate-200">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Campuses</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-blue-700">{stats.total}</p>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-slate-200">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Partners</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-emerald-700">{stats.active}</p>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-slate-200">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Students</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-violet-700">{stats.totalStudents.toLocaleString()}</p>
          </div>

          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-slate-200">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Avg Network Integrity</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-indigo-700">{stats.avgIntegrity}%</p>
          </div>
        </div>

        {/* ── Filters & Search ─────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campuses..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
                {(["all", "active", "inactive", "suspended"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold capitalize transition-all ${statusFilter === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 rounded-lg bg-slate-50 p-0.5">
                {["all", "Tier 1", "Tier 2", "Tier 3"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${tierFilter === t
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                  >
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 ring-1 ring-blue-200">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} selected</span>
                <div className="h-4 w-px bg-blue-200"></div>
                <button onClick={() => handleBulkAction("activate")} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">Activate</button>
                <div className="h-4 w-px bg-blue-200"></div>
                <button onClick={() => handleBulkAction("suspend")} className="text-xs font-bold text-amber-700 hover:text-amber-800">Suspend</button>
                <div className="h-4 w-px bg-blue-200"></div>
                <button onClick={() => handleBulkAction("delete")} className="text-xs font-bold text-red-700 hover:text-red-800">Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Table View ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 ring-slate-100 focus:ring-blue-500" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} />
                  </th>
                  {["Campus", "Location", "Tier", "Students", "Assessments", "Avg Score", "Integrity", "Status", "Risk", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">No campuses match your filters.</td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr
                        className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 cursor-pointer ${expandedRows.has(c.id) ? 'bg-slate-50/50' : ''}`}
                        onDoubleClick={() => navigate(`/app/campuses/${c.id}/edit`)}
                        onClick={(e) => toggleExpand(c.id, e)}
                      >
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 ring-slate-100 focus:ring-blue-500" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center text-slate-400">
                              {expandedRows.has(c.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 max-w-[200px] truncate">
                                {c.name}
                              </p>
                              <p className="text-xs text-slate-400">{c.college_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          <span className="truncate block max-w-[120px]">{c.city}, {c.state}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.tier === "Tier 1" ? "bg-amber-50 text-amber-700" : c.tier === "Tier 2" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                            {c.tier || "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                          {c.student_count.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-700">
                          {c.assessments_count.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-800">
                          {c.avg_score.toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-800">
                          {(100 - c.avg_risk_score).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3">
                          {c.is_suspended ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Suspended</span>
                          ) : c.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {getRiskBadge(c)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="relative" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === c.id ? null : c.id); }}>
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openDropdownId === c.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5">
                                <Link to={`/app/campuses/${c.id}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700">Enter Deep View</Link>
                                <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700">Assign Assessment</button>
                                <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700">Download Report</button>
                                {c.is_active ? (
                                  <button onClick={() => bulkMutation.mutate({ action: 'suspend', ids: [c.id] })} className="block w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-amber-50">Suspend</button>
                                ) : (
                                  <button onClick={() => bulkMutation.mutate({ action: 'activate', ids: [c.id] })} className="block w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50">Activate</button>
                                )}
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
                                <p className="font-bold text-slate-700">{c.admin_count}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Active Segments</p>
                                <p className="font-bold text-slate-700">{c.category || "General"} • {c.naac_grade ? `NAAC ${c.naac_grade}` : "Unrated"}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Incidents Flagged</p>
                                <p className="font-bold text-red-600">{c.incident_count}</p>
                              </div>
                              <div className="flex items-center">
                                <Link to={`/app/campuses/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100">
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
        </div>
      </div>
    </div>
  );
}