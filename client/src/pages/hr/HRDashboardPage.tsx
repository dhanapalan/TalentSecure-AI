import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Plus, Send, School } from "lucide-react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import ExamProgressView from "../../components/ExamProgressView";

export default function HRDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<{ id: string, title: string } | null>(null);

  // Fetch HR Stats
  const { data: hrStats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const { data } = await api.get("/hr/stats");
      return data.data;
    }
  });

  // Fetch Active Exams for LIVE Monitoring
  const { data: activeExams, isLoading: loadingActiveExams } = useQuery({
    queryKey: ["active-exams"],
    queryFn: async () => {
      const { data } = await api.get("/exams/active");
      return data.data;
    }
  });

  // Fetch HR Activity
  const { data: activities } = useQuery({
    queryKey: ["hr-activity"],
    queryFn: async () => {
      const { data } = await api.get("/hr/activity");
      return data.data;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            HR Dashboard
          </h1>
          <p className="mt-1.5 text-gray-500">
            Welcome back, <span className="font-semibold text-indigo-600">{user?.name}</span>.
            Manage your recruitment pipeline and global campus footprint.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/roles")}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Role
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95">
            <Send className="h-4 w-4" />
            Create Drive
          </button>
        </div>
      </div>

      {/* ── Dashboard Overview Content ── */}
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Roles", value: "12", trend: "+2 this month", color: "bg-blue-500" },
            {
              label: "Total Campuses",
              value: hrStats?.campus_count || "0",
              trend: "Registered partners",
              color: hrStats?.campus_count > 0 ? "bg-indigo-500" : "bg-gray-400"
            },
            {
              label: "Active Assessments",
              value: hrStats?.active_exams || "0",
              trend: "Live/Scheduled",
              color: hrStats?.active_exams > 0 ? "bg-purple-500" : "bg-gray-400"
            },
            {
              label: "Security Alerts",
              value: hrStats?.critical_violations || "0",
              trend: "High severity",
              color: hrStats?.critical_violations > 0 ? "bg-red-500" : "bg-emerald-500"
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  stat.label === "Security Alerts" && hrStats?.critical_violations > 0
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600"
                )}>
                  {stat.trend}
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full w-2/3 rounded-full ${stat.color} transition-all group-hover:w-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Sub-sections */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 italic">Upcoming Drives</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:underline">View All</button>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-indigo-50 p-4">
                <School className="h-8 w-8 text-indigo-300" />
              </div>
              <h4 className="mt-4 font-semibold text-gray-900">No active drives found</h4>
              <p className="mt-1 text-sm text-gray-500 max-w-[240px]">
                Create a drive and assign an assessment to start the recruitment process.
              </p>
              <button className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800">
                Host First Drive
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 italic">Recent Activity</h2>
            </div>
            <div className="mt-8 space-y-4">
              {activities?.length ? activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={clsx(
                    "mt-1.5 h-2 w-2 rounded-full",
                    act.type === "security" ? "bg-red-500" : "bg-indigo-400"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">{act.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400">No recent activity detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Active Assessments (Live Monitoring) ── */}
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-gray-900 italic">Live Assessment Monitoring</h3>
            <p className="text-sm text-gray-400 font-medium">Real-time oversight of all ongoing recruitment drives</p>
          </div>
          {loadingActiveExams ? (
            <div className="h-48 animate-pulse rounded-3xl bg-gray-50" />
          ) : activeExams?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeExams.map((exam: any) => (
                <div key={exam.id} className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-500 h-2 w-2 animate-pulse" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{exam.violation_count} Violations</span>
                    </div>
                    <h4 className="mt-4 font-black text-gray-900 leading-tight">{exam.title}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(exam.scheduled_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedExam({ id: exam.id, title: exam.title })}
                    className="mt-6 w-full rounded-2xl bg-gray-900 py-3 text-xs font-black text-white hover:bg-black transition-all shadow-md active:scale-95"
                  >
                    MONITOR LIVE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 italic text-gray-400">
              No assessments are currently active for monitoring.
            </div>
          )}
        </div>
      </div>

      {selectedExam && (
        <ExamProgressView
          examId={selectedExam.id}
          examTitle={selectedExam.title}
          onClose={() => setSelectedExam(null)}
          isHr={true}
        />
      )}
    </div>
  );
}
