import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Send, School, History, AlertCircle, TrendingUp, Monitor, ArrowRight, Activity, Users as UsersIcon, BookOpen as BookOpenIcon } from "lucide-react";
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
    <div className="min-h-full space-y-6 pb-12 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Activity className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Operational Overview</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
            HR Dashboard
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium text-slate-500 leading-relaxed">
            Welcome back, <span className="font-bold text-slate-900 border-b-2 border-indigo-500/30">{user?.name}</span>.
            Your recruitment pipeline is <span className="text-emerald-600 font-bold">active</span> and monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/assessments/blueprint")}
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <Send className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            Create New Drive
          </button>
        </div>
      </div>

      {/* ── Stats Section ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "TOTAL CAMPUSES",
            value: hrStats?.campus_count || "0",
            icon: <School className="h-4 w-4" />,
            trend: "Network Hubs",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
          },
          {
            label: "TOTAL STUDENTS",
            value: hrStats?.student_count || "0",
            icon: <Activity className="h-4 w-4" />,
            trend: "Talent Stream",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            label: "LIVE ASSESSMENTS",
            value: hrStats?.active_exams || "0",
            icon: <Monitor className="h-4 w-4" />,
            trend: "Active Signals",
            color: "text-purple-600",
            bg: "bg-purple-50"
          },
          {
            label: "PASS RATIO",
            value: `${hrStats?.pass_ratio || "0"}%`,
            icon: <TrendingUp className="h-4 w-4" />,
            trend: "Competency Index",
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-white bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:bg-slate-900 group-hover:text-white", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900 tabular-nums">{stat.value}</p>
            </div>
            <div className="absolute -bottom-1 left-0 h-1 w-full bg-slate-50/50">
              <div className={clsx("h-full transition-all duration-1000", stat.bg.replace('bg-', 'bg-').replace('-50', '-500'))} style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Drives - 2/3 Width */}
        <div className="lg:col-span-2 rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Recruitment Drives</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Scheduled institutional visits and assessments</p>
            </div>
            <button className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white">
              View All Drives
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/30 rounded-xl border-2 border-dashed border-slate-200">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300">
              <School className="h-8 w-8" />
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md">
                <TrendingUp className="h-3 w-3" />
              </div>
            </div>
            <h4 className="mt-4 text-lg font-bold text-slate-900">No active drives detected</h4>
            <p className="mt-1.5 max-w-xs text-xs font-medium text-slate-500 leading-relaxed text-center">
              Launch your next campus recruitment drive by preparing your talent pool and question bank.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm">
              <button
                onClick={() => navigate("/app/students")}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 transition-all group"
              >
                <UsersIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Upload Students</span>
              </button>
              <button
                onClick={() => navigate("/assessments/bank")}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 transition-all group"
              >
                <BookOpenIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Question Bank</span>
              </button>
            </div>

            <button
              onClick={() => navigate("/app/assessments/blueprint")}
              className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-600 active:scale-95 shadow-sm"
            >
              Initialize First Drive
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Activity - 1/3 Width */}
        <div className="rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-xl flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">System Log</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <History className="h-3 w-3" />
              Real-time audit trails
            </p>
          </div>

          <div className="flex-1 space-y-2">
            {activities?.length ? activities.map((act: any) => (
              <div key={act.id} className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:bg-white hover:border-slate-100 hover:shadow-sm">
                <div className={clsx(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-white shadow-sm",
                  act.type === "security" ? "bg-red-500" : "bg-indigo-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{act.text}</p>
                  <p className="mt-0.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">{act.time}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-300">
                <p className="text-xs italic">No activity detected within the last 24h.</p>
              </div>
            )}
          </div>

          <button className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-[10px] font-black text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-widest">
            Detailed Audit Log
          </button>
        </div>
      </div>

      {/* ── Active Assessments (Live Monitoring) ── */}
      <div className="rounded-3xl border border-slate-900 bg-slate-900 p-8 text-white shadow-xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Monitor className="h-3 w-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Signal Presence</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">Live Terminal Monitoring</h3>
            <p className="mt-1 text-xs text-slate-400 font-medium">Global proctoring engine actively enforcing anti-cheating protocols</p>
          </div>
          <div className="flex h-10 items-center gap-3 rounded-xl bg-white/5 px-4 border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-300">Network Status: Nominal</span>
          </div>
        </div>

        {loadingActiveExams ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : activeExams?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeExams.map((exam: any) => (
              <div key={exam.id} className="group relative rounded-2xl bg-white/5 p-6 border border-white/10 transition-all hover:bg-white/10 hover:border-indigo-500/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{new Date(exam.scheduled_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2 py-0.5">
                    <AlertCircle className="h-3 w-3 text-red-400" />
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{exam.violation_count}</span>
                  </div>
                </div>
                <h4 className="mt-4 text-lg font-black leading-tight text-white group-hover:text-indigo-400 transition-colors">{exam.title}</h4>
                <p className="mt-1 text-xs font-medium text-slate-500">Live recruitment drive</p>

                <button
                  onClick={() => setSelectedExam({ id: exam.id, title: exam.title })}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[10px] font-black text-slate-900 transition-all hover:bg-indigo-500 hover:text-white active:scale-95"
                >
                  ACCESS LIVE SIGNAL
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="group py-12 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center">
            <Monitor className="h-8 w-8 text-slate-600 mb-2 transition-transform group-hover:scale-110" />
            <p className="text-sm font-bold text-slate-500">No active assessments in the signal pool.</p>
          </div>
        )}
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
