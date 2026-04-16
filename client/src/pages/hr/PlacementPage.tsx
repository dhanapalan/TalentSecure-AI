// =============================================================================
// GradLogic — Placement Tracking Page (Phase 4)
// Stats · Funnel · Records · Mark Placed Form
// =============================================================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

// =============================================================================
// TYPES
// =============================================================================
interface PlacementRecord {
  id: string; student_id: string; student_name: string; student_email: string;
  degree: string; passing_year: number; college_name: string;
  company_name: string; role_title: string | null; package_lpa: number | null;
  offer_type: string; placed_at: string; drive_name: string | null;
  placed_by_name: string | null;
}
interface PlacementStats {
  overview: { total_placed: number; avg_package_lpa: number | null; highest_package_lpa: number | null; unique_companies: number; colleges_represented: number };
  by_company: { company_name: string; placed_count: number; avg_package: number | null }[];
  by_year: { year: number; placed_count: number; avg_package: number | null }[];
  by_offer_type: { offer_type: string; count: number }[];
  top_packages: { student_name: string; company_name: string; role_title: string | null; package_lpa: number | null }[];
}
interface Funnel {
  invited: number; submitted: number; shortlisted: number;
  interviewed: number; offered: number; placed: number;
}

// =============================================================================
// STAT CARD
// =============================================================================
function StatCard({ label, value, color = "text-indigo-600", sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

// =============================================================================
// FUNNEL CHART
// =============================================================================
function FunnelChart({ data }: { data: Funnel }) {
  const steps = [
    { label: "Invited",     value: data.invited,     color: "bg-indigo-500" },
    { label: "Submitted",   value: data.submitted,   color: "bg-blue-500" },
    { label: "Shortlisted", value: data.shortlisted, color: "bg-cyan-500" },
    { label: "Interviewed", value: data.interviewed, color: "bg-yellow-500" },
    { label: "Offered",     value: data.offered,     color: "bg-orange-500" },
    { label: "Placed",      value: data.placed,      color: "bg-green-500" },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-5">Placement Funnel</h3>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const pct = Math.round((s.value / max) * 100);
          const convPct = i > 0 && steps[i - 1].value > 0
            ? Math.round((s.value / steps[i - 1].value) * 100)
            : null;
          return (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{s.label}</span>
                <div className="flex items-center gap-2">
                  {convPct !== null && (
                    <span className="text-xs text-gray-400">{convPct}% of prev</span>
                  )}
                  <span className="font-semibold text-gray-800">{s.value.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                <div className={`${s.color} h-6 rounded-full transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${pct}%` }}>
                  {pct > 15 && <span className="text-white text-xs font-medium">{pct}%</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MARK PLACED FORM
// =============================================================================
function MarkPlacedForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [form, setForm] = useState({
    company_name: "", role_title: "", package_lpa: "",
    offer_type: "full_time", placed_at: new Date().toISOString().slice(0, 10),
    joining_date: "", notes: "", drive_id: "",
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["student-search", search],
    queryFn: () => api.get(`/users?role=student&search=${encodeURIComponent(search)}&limit=8`).then(r => r.data.data),
    enabled: search.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/placements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placements"] });
      qc.invalidateQueries({ queryKey: ["placement-stats"] });
      qc.invalidateQueries({ queryKey: ["placement-funnel"] });
      onSuccess();
    },
  });

  const submit = () => {
    if (!selectedStudent || !form.company_name) return;
    mutation.mutate({
      student_id: selectedStudent.id,
      ...form,
      package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
      drive_id: form.drive_id || null,
      joining_date: form.joining_date || null,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Record New Placement</h3>

      {/* Student search */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Search Student</label>
        {selectedStudent ? (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">{selectedStudent.name}</p>
              <p className="text-xs text-gray-500">{selectedStudent.email}</p>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="text-xs text-red-400 hover:text-red-600">Change</button>
          </div>
        ) : (
          <div className="relative">
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Type student name or email..." value={search}
              onChange={e => setSearch(e.target.value)} />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {searchResults.map((s: any) => (
                  <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => { setSelectedStudent({ id: s.id, name: s.name, email: s.email }); setSearch(""); }}>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Company Name *</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. TCS, Infosys, Zoho..." value={form.company_name}
            onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Role / Designation</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Software Engineer" value={form.role_title}
            onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Package (LPA)</label>
          <input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. 6.5" value={form.package_lpa}
            onChange={e => setForm(f => ({ ...f, package_lpa: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Offer Type</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.offer_type} onChange={e => setForm(f => ({ ...f, offer_type: e.target.value }))}>
            <option value="full_time">Full Time</option>
            <option value="internship">Internship</option>
            <option value="ppo">PPO</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Placement Date</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.placed_at} onChange={e => setForm(f => ({ ...f, placed_at: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Joining Date</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Any additional notes..." value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">Failed to save. Please try again.</p>
      )}

      <div className="flex gap-3 justify-end">
        <button onClick={onSuccess} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={submit} disabled={!selectedStudent || !form.company_name || mutation.isPending}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {mutation.isPending ? "Saving..." : "Confirm Placement"}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// STATS TAB
// =============================================================================
function StatsTab() {
  const { data: stats, isLoading: statsLoading } = useQuery<PlacementStats>({
    queryKey: ["placement-stats"],
    queryFn: () => api.get("/placements/stats").then(r => r.data.data),
  });
  const { data: funnelData, isLoading: funnelLoading } = useQuery<Funnel>({
    queryKey: ["placement-funnel"],
    queryFn: () => api.get("/placements/funnel").then(r => r.data.data),
  });

  if (statsLoading || funnelLoading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  const ov = stats?.overview;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Placed" value={(ov?.total_placed || 0).toLocaleString()} color="text-green-600" />
        <StatCard label="Avg Package" value={ov?.avg_package_lpa ? `₹${ov.avg_package_lpa} LPA` : "—"} color="text-indigo-600" />
        <StatCard label="Highest Package" value={ov?.highest_package_lpa ? `₹${ov.highest_package_lpa} LPA` : "—"} color="text-purple-600" />
        <StatCard label="Companies" value={ov?.unique_companies || 0} color="text-blue-600" />
        <StatCard label="Colleges" value={ov?.colleges_represented || 0} color="text-orange-600" />
      </div>

      {funnelData && <FunnelChart data={funnelData} />}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top companies */}
        {(stats?.by_company?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h4 className="font-medium text-gray-700 mb-3 text-sm">Top Hiring Companies</h4>
            <div className="space-y-2">
              {stats!.by_company.map((c, i) => (
                <div key={c.company_name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{c.company_name}</p>
                    {c.avg_package && <p className="text-xs text-gray-400">Avg ₹{c.avg_package} LPA</p>}
                  </div>
                  <span className="text-sm font-semibold text-green-600">{c.placed_count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top packages */}
        {(stats?.top_packages?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h4 className="font-medium text-gray-700 mb-3 text-sm">Highest Packages</h4>
            <div className="space-y-2">
              {stats!.top_packages.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.student_name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.company_name}{p.role_title ? ` · ${p.role_title}` : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-purple-600">₹{p.package_lpa} LPA</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Year-wise trend */}
      {(stats?.by_year?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Year-wise Placements</h4>
          <div className="flex items-end gap-4 h-28">
            {stats!.by_year.map(y => {
              const maxCount = Math.max(...stats!.by_year.map(x => x.placed_count), 1);
              return (
                <div key={y.year} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-green-400 rounded-t transition-all"
                    style={{ height: `${(y.placed_count / maxCount) * 100}%`, minHeight: "4px" }}
                    title={`${y.placed_count} placed`} />
                  <span className="text-xs text-gray-500">{y.year}</span>
                  <span className="text-xs font-semibold text-green-600">{y.placed_count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RECORDS TAB
// =============================================================================
function RecordsTab({ onMarkPlaced }: { onMarkPlaced: () => void }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const PER_PAGE = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["placements", page, search],
    queryFn: () => api.get(`/placements?limit=${PER_PAGE}&offset=${page * PER_PAGE}${search ? `&company=${encodeURIComponent(search)}` : ""}`).then(r => r.data),
  });

  const rows: PlacementRecord[] = data?.data || [];
  const total: number = data?.meta?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/placements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["placements"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm"
          placeholder="Filter by company..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <button onClick={onMarkPlaced}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 whitespace-nowrap">
          + Mark Placed
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {["Student", "Company", "Role", "Package", "Type", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.student_name}</p>
                      <p className="text-xs text-gray-400">{r.college_name}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{r.company_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.role_title || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      {r.package_lpa ? `₹${r.package_lpa} LPA` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 capitalize">
                        {r.offer_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm("Delete this placement record?")) deleteMutation.mutate(r.id); }}
                        className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No placements recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {total > PER_PAGE && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded-lg border disabled:opacity-40">← Prev</button>
                <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded-lg border disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

type Tab = "stats" | "records";

export default function PlacementPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Record, monitor and analyse student placements</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700">
          {showForm ? "Cancel" : "+ Mark Placed"}
        </button>
      </div>

      {showForm && <MarkPlacedForm onSuccess={() => setShowForm(false)} />}

      <div className="flex border-b border-gray-200 gap-1">
        {(["stats", "records"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 capitalize transition-colors ${
              tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "stats" ? "Dashboard" : "All Records"}
          </button>
        ))}
      </div>

      {tab === "stats"   && <StatsTab />}
      {tab === "records" && <RecordsTab onMarkPlaced={() => setShowForm(true)} />}
    </div>
  );
}
