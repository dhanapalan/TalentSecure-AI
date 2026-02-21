import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ── Helpers ─────────────────────────────────────────────────────────────────

function riskBadge(score: number) {
  if (score >= 70)
    return <span className="badge bg-red-100 text-red-800">{score.toFixed(0)}</span>;
  if (score >= 40)
    return (
      <span className="badge bg-yellow-100 text-yellow-800">{score.toFixed(0)}</span>
    );
  return (
    <span className="badge bg-green-100 text-green-800">{score.toFixed(0)}</span>
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

// ── Component ────────────────────────────────────────────────────────────────

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

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // ── Modal state ────────────────────────────────────────────────────────────
  const [resolveTarget, setResolveTarget] = useState<InterruptedAttempt | null>(null);
  const [reason, setReason] = useState("");
  // Dashboard summary stats
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
    refetchInterval: 10_000, // auto-refresh every 10s
  });

  // Active exams with violation counts
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

  // Cheating logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["cheating-logs"],
    queryFn: async () => {
      const { data } = await api.get("/cheating-logs?limit=25");
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

  // Interrupted exam attempts
  const { data: interrupted, isLoading: interruptedLoading } = useQuery({
    queryKey: ["interrupted-exams"],
    queryFn: async () => {
      const { data } = await api.get("/admin/exams/interrupted");
      return data.data as InterruptedAttempt[];
    },
    refetchInterval: 10_000,
  });

  // Resolve interruption mutation
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
        toast.success(
          "Exam Resumed — student can continue from where they left off",
          { duration: 5000 },
        );
      } else {
        toast.success(
          "Fresh Reset — student will start a new attempt from scratch",
          { duration: 5000 },
        );
      }
      setResolveTarget(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["interrupted-exams"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to resolve interruption",
      );
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

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    {
      name: "Active Exams",
      value: stats?.activeExams ?? "—",
      icon: ClipboardDocumentListIcon,
      color: "bg-blue-500",
    },
    {
      name: "Total Violations",
      value: stats?.totalViolations ?? "—",
      icon: ShieldExclamationIcon,
      color: "bg-red-500",
    },
    {
      name: "High-Risk Alerts",
      value: stats?.highRiskAlerts ?? "—",
      icon: ExclamationTriangleIcon,
      color: "bg-amber-500",
      desc: "risk > 70",
    },
    {
      name: "Students Flagged",
      value: stats?.uniqueStudentsFlagged ?? "—",
      icon: UserGroupIcon,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Real-time proctoring overview &middot; auto-refreshes every 10s
          </p>
        </div>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      </div>

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.name} className="card flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}
            >
              <s.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                {s.name}
                {s.desc && (
                  <span className="ml-1 text-xs text-gray-400">({s.desc})</span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "…" : s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Exams */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Active Exams</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Exam Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Scheduled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Violations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {examsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Loading exams…
                  </td>
                </tr>
              ) : activeExams && activeExams.length > 0 ? (
                activeExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {exam.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(exam.scheduled_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exam.duration} min
                    </td>
                    <td className="px-4 py-3">
                      {exam.violation_count > 0 ? (
                        <span className="badge bg-red-100 text-red-800">
                          {exam.violation_count}
                        </span>
                      ) : (
                        <span className="badge bg-green-100 text-green-800">0</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No active exams
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cheating Logs */}
      <div className="card mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Cheating Logs
            {logsData?.meta?.total != null && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({logsData.meta.total} total)
              </span>
            )}
          </h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Exam
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Violation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Loading logs…
                  </td>
                </tr>
              ) : logsData?.data && logsData.data.length > 0 ? (
                logsData.data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.student_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.exam_title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge bg-gray-100 text-gray-700">
                        {violationLabel(log.violation_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{riskBadge(log.risk_score)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {relativeTime(log.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No violations recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interrupted Exams */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Interrupted Exams
          {interrupted && interrupted.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({interrupted.length})
            </span>
          )}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Exam
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Last Saved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interruptedLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading interrupted exams…
                  </td>
                </tr>
              ) : interrupted && interrupted.length > 0 ? (
                interrupted.map((row) => (
                  <tr key={row.attempt_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.student_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {row.student_email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.exam_title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge bg-amber-100 text-amber-800">
                        Q{row.current_question_index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {relativeTime(row.last_saved_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setResolveTarget(row);
                          setReason("");
                        }}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Resolve / Restart
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No interrupted exams
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Resolve Modal ───────────────────────────────────────────────────── */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setResolveTarget(null)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setResolveTarget(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              Resolve Interrupted Exam
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {resolveTarget.student_name}
              </span>{" "}
              &mdash; {resolveTarget.exam_title}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              The backend will automatically decide whether to{" "}
              <strong>Resume</strong> (if saved answers exist) or{" "}
              <strong>Fresh Reset</strong> (if no progress was saved).
            </p>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              Reason for Override
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Student reported power outage during the exam"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setResolveTarget(null)}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={!reason.trim() || resolveMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolveMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
