import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ServerStackIcon,
  CpuChipIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// ── Helpers ─────────────────────────────────────────────────────────────────

function riskBadge(score: number) {
  if (score >= 70)
    return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/10">{score.toFixed(0)}</span>;
  if (score >= 40)
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10">{score.toFixed(0)}</span>
    );
  return (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">{score.toFixed(0)}</span>
  );
}

function violationLabel(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Types ────────────────────────────────────────────────────────────────────

interface InterruptedAttempt {
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  exam_id: string;
  exam_title: string;
  current_question_index: number;
  started_at: string;
  last_saved_at: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [resolveTarget, setResolveTarget] = useState<InterruptedAttempt | null>(null);
  const [reason, setReason] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/cheating-logs/stats");
      return data.data as {
        totalViolations: number;
        highRiskAlerts: number;
        uniqueStudentsFlagged: number;
        activeExams: number;
      };
    },
    refetchInterval: 10_000,
  });

  const { data: activeExams, isLoading: examsLoading } = useQuery({
    queryKey: ["active-exams"],
    queryFn: async () => {
      const { data } = await api.get("/exams/active");
      return data.data as Array<{
        id: string;
        title: string;
        scheduled_time: string;
        duration: number;
        violation_count: number;
      }>;
    },
    refetchInterval: 10_000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["cheating-logs"],
    queryFn: async () => {
      const { data } = await api.get("/cheating-logs?limit=10"); // Limit to 10 for dashboard
      return data as {
        data: Array<{
          id: string;
          student_name: string;
          exam_title: string;
          violation_type: string;
          risk_score: number;
          timestamp: string;
        }>;
        meta: { total: number };
      };
    },
    refetchInterval: 10_000,
  });

  const { data: interrupted, isLoading: interruptedLoading } = useQuery({
    queryKey: ["interrupted-exams"],
    queryFn: async () => {
      const { data } = await api.get("/admin/exams/interrupted");
      return data.data as InterruptedAttempt[];
    },
    refetchInterval: 10_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const resolveMutation = useMutation({
    mutationFn: async (payload: {
      student_id: string;
      exam_id: string;
      reason: string;
    }) => {
      const { data } = await api.post(
        "/admin/exams/resolve-interruption",
        payload,
      );
      return data as {
        success: boolean;
        data: { action: "EXAM_RESUMED" | "EXAM_RESET" };
        message: string;
      };
    },
    onSuccess: (res) => {
      const action = res.data.action;
      if (action === "EXAM_RESUMED") {
        toast.success("Exam Resumed — student can continue.", { duration: 5000 });
      } else {
        toast.success("Fresh Reset — student starts a new attempt.", { duration: 5000 });
      }
      setResolveTarget(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["interrupted-exams"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to resolve interruption");
    },
  });

  function handleResolveSubmit() {
    if (!resolveTarget || !reason.trim()) return;
    resolveMutation.mutate({
      student_id: resolveTarget.student_id,
      exam_id: resolveTarget.exam_id,
      reason: reason.trim(),
    });
  }

  // ── Data Formatting ────────────────────────────────────────────────────────
  const statCards = [
    {
      name: "Active Exams",
      value: stats?.activeExams ?? "—",
      icon: ClipboardDocumentListIcon,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      valueColor: "text-blue-700",
    },
    {
      name: "Total Violations",
      value: stats?.totalViolations ?? "—",
      icon: ShieldExclamationIcon,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      valueColor: "text-red-700",
    },
    {
      name: "High-Risk Alerts",
      value: stats?.highRiskAlerts ?? "—",
      icon: ExclamationTriangleIcon,
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
      valueColor: "text-amber-700",
      desc: "Score > 70",
    },
    {
      name: "Students Flagged",
      value: stats?.uniqueStudentsFlagged ?? "—",
      icon: UserGroupIcon,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      valueColor: "text-purple-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{ background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #ECFEFF 100%)" }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-200/40 blur-2xl sm:-left-16 sm:h-48 sm:w-48" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm ring-1 ring-black/5 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live Monitoring Active
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Operational Control
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Real-time overview of system health, active assessments, and security incidents. Data auto-refreshes every 10 seconds.
              </p>
            </div>

            {/* Quick action buttons for the banner */}
            <div className="flex shrink-0 gap-3">
              <Link
                to="/app/proctoring"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all hover:shadow-lg"
              >
                <ShieldCheckIcon className="h-4 w-4" /> Live Proctoring
              </Link>
            </div>
          </div>
        </div>

        {/* 1. Overview (KPIs) ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 mb-4 px-1">1. Platform Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.name}
                className="group flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all sm:gap-4 sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl ${s.bgColor} flex items-center justify-center sm:h-11 sm:w-11`}>
                    <s.icon className={`h-5 w-5 ${s.textColor} sm:h-5.5 sm:w-5.5`} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-[11px]">
                    {s.name} {s.desc && <span className="opacity-75">({s.desc})</span>}
                  </p>
                  <p className={`mt-1 text-2xl font-black ${s.valueColor} tabular-nums sm:text-3xl`}>
                    {statsLoading ? "…" : s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Column Layout for Exams & Pending Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 2. Active Exams Snapshot ─────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-sm font-black tracking-tight text-slate-900">2. Active Exams Snapshot</h2>
              <p className="mt-0.5 text-xs text-slate-400">Exams currently in progress.</p>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {examsLoading ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">Loading exams…</td></tr>
                  ) : activeExams && activeExams.length > 0 ? (
                    activeExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm font-bold text-slate-900">{exam.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{exam.duration} mins · {new Date(exam.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {exam.violation_count > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/10">
                              {exam.violation_count} Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                              0 Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">No active exams</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
              <Link to="/app/assessments" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View All Assessments <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 3. Pending Actions ───────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-amber-50/30 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black tracking-tight text-slate-900">3. Pending Actions</h2>
                <p className="mt-0.5 text-xs text-slate-500">Interrupted attempts requiring operator resolution.</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1">
                <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-700">{interrupted?.length || 0}</span>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              {interruptedLoading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading actions…</div>
              ) : interrupted && interrupted.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {interrupted.map((row) => (
                    <div key={row.attempt_id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{row.student_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{row.exam_title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Q{row.current_question_index + 1}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" /> Saved {relativeTime(row.last_saved_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setResolveTarget(row);
                          setReason("");
                        }}
                        className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors w-full sm:w-auto text-center"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">All Clear</p>
                  <p className="text-xs text-slate-500 mt-1">No pending interruptions to resolve.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Recent Incidents ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900">4. Recent Incidents</h2>
              <p className="mt-0.5 text-xs text-slate-400">Latest proctoring integrity flags.</p>
            </div>
            {logsData?.meta?.total != null && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                {logsData.meta.total} Total Records
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Timestamp</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Violation Type</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {logsLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">Loading incidents…</td></tr>
                ) : logsData?.data && logsData.data.length > 0 ? (
                  logsData.data.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {relativeTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-slate-900">{log.student_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{log.exam_title}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {violationLabel(log.violation_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {riskBadge(log.risk_score)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No security incidents logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
            <Link to="/app/proctoring" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Open Full Investigaton View <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* 5. System Health ───────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <h2 className="text-sm font-black tracking-tight text-slate-900 mb-6">5. System Infrastructure Health</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <ServerStackIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  API Gateway <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">100% Uptime</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <CpuChipIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Proctoring AI <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Normal Load: 240ms latency</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <CircleStackIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Database Cluster <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Storage 42% · Read/Write OK</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Resolve Modal ───────────────────────────────────────────────── */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setResolveTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setResolveTarget(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Resolve Interruption</h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin Operator Override</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 mb-5 border border-slate-100">
              <p className="text-sm font-bold text-slate-900">{resolveTarget.student_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{resolveTarget.exam_title}</p>
            </div>

            <p className="text-sm font-medium text-slate-700 mb-2">Override Reason</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Verified student reported power outage during the exam..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setResolveTarget(null)}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={!reason.trim() || resolveMutation.isPending}
                className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {resolveMutation.isPending ? "Submitting…" : "Authorize Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
