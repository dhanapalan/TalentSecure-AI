import { useAuthStore } from "../../stores/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Check,
  ArrowRight,
  BookOpen,
  Trophy,
  User,
  ShieldCheck,
  AlertCircle,
  Play,
  RotateCcw,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentPortalPage() {
  const user = useAuthStore((s) => s.user);

  // Queries
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data.data;
    },
  });

  // Fetch drives assigned to this student
  const { data: drives, isLoading: loadingDrives } = useQuery({
    queryKey: ["student-drives"],
    queryFn: async () => {
      const { data } = await api.get("/exam-sessions/my-drives");
      return data.data;
    },
    enabled: !!user?.id,
  });

  if (loadingProfile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Determine view: if profile not complete, show onboarding
  const isProfileComplete = profile?.is_profile_complete;

  if (!isProfileComplete) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gray-900 p-10 text-white text-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Complete Your Profile</h1>
                <p className="text-gray-400 font-medium">
                  Personal, contact, academic, and resume details are required before assessments.
                </p>
              </div>
            </div>
          </div>
          <div className="p-10">
            <Link
              to="/student-onboarding"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Go To Onboarding Form
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Categorize drives
  const activeDrives = (drives || []).filter((d: any) =>
    (d.session_status === "assigned" || d.session_status === "registered" || d.session_status === "in_progress") &&
    (d.drive_status && (d.drive_status.toUpperCase() === "PUBLISHED" || d.drive_status.toUpperCase() === "ACTIVE" || d.drive_status.toUpperCase() === "COMPLETED" || d.drive_status.toUpperCase() === "SCHEDULED"))
  );
  const completedDrives = (drives || []).filter((d: any) => d.session_status === "completed");

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* ── Welcome Header ── */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gray-900 p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/30 mb-6">
            <Check className="h-3 w-3" />
            PROFILE VERIFIED
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            Hello, {user?.name.split(" ")[0]}!
          </h1>
          <p className="mt-4 text-gray-400 text-lg font-medium max-w-lg">
            You have <span className="text-white font-bold">{activeDrives.length} active assessment{activeDrives.length !== 1 ? "s" : ""}</span> assigned to your profile.
          </p>
        </div>
        <Trophy className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 rotate-12" />
      </div>

      {/* ── Dashboard Content ── */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

        {/* ── Active & Upcoming Assessments (Main) ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Assessments</h2>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {activeDrives.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loadingDrives ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-[2.5rem] bg-gray-100" />
              ))
            ) : activeDrives.length > 0 ? (
              activeDrives.map((drive: any) => (
                <div key={drive.drive_id} className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                        <BookOpen className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">{drive.drive_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{drive.rule_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {drive.session_status === "in_progress" ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                          <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                          IN PROGRESS
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          <div className="h-2 w-2 rounded-full bg-emerald-600" />
                          {drive.session_status === "registered" ? "REGISTERED" : "ASSIGNED"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-8 border-t border-gray-50">
                    <div className="flex items-center gap-6">
                      {drive.scheduled_start && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">{new Date(drive.scheduled_start).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{drive.duration_minutes} Mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{drive.total_questions} Qs</span>
                      </div>
                    </div>
                    <Link
                      to={`/app/student-portal/exam/${drive.drive_id}/instructions`}
                      className="flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-3.5 text-sm font-black text-white hover:bg-black transition-all group/btn"
                    >
                      {drive.session_status === "in_progress" ? (
                        <>
                          <RotateCcw className="h-4 w-4" />
                          RESUME
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          START EXAM
                        </>
                      )}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">No assessments assigned yet.</p>
                <p className="text-sm text-gray-400 mt-1">Contact your college coordinator for more info.</p>
              </div>
            )}
          </div>

          {/* Completed Assessments */}
          {completedDrives.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4 px-2">Completed Assessments</h2>
              <div className="space-y-4">
                {completedDrives.map((drive: any) => (
                  <div key={drive.drive_id} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">{drive.drive_name}</h4>
                        <p className="text-xs text-gray-400 font-bold">
                          Completed {drive.completed_at ? new Date(drive.completed_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600">{drive.score ?? "—"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">/ {drive.total_marks}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar (Profile & Prep) ── */}
        <div className="space-y-8">
          {/* ── Profile Status ── */}
          <div className="rounded-[2.5rem] bg-white border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-gray-100 border-4 border-white shadow-inner flex items-center justify-center">
                <User className="h-7 w-7 text-gray-400" />
              </div>
              <div>
                <h4 className="font-black text-gray-900">Your Credentials</h4>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Candidate ID: {user?.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Affiliation</p>
                <p className="text-sm font-black text-gray-900 mt-1">{profile?.college_name || "N/A"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course Focus</p>
                <p className="text-sm font-black text-gray-900 mt-1">
                  {profile?.specialization || "N/A"} ({profile?.degree || "N/A"})
                </p>
              </div>
            </div>
          </div>

          {/* ── Performance Stats ── */}
          <div className="rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
            <h4 className="text-lg font-black tracking-tight mb-6">Performance Index</h4>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-indigo-100">Exams Taken</span>
                  <span className="text-lg font-black">{completedDrives.length}</span>
                </div>
              </div>
              {completedDrives.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-indigo-100">Average Score</span>
                    <span className="text-lg font-black">
                      {Math.round(
                        completedDrives.reduce((acc: number, d: any) => acc + (Number(d.score) || 0), 0) / completedDrives.length
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-100">
                <Award className="h-4 w-4" />
                {completedDrives.length > 0 ? "Keep performing well!" : "Complete your first exam"}
              </div>
            </div>
            <ShieldCheck className="absolute -bottom-8 -right-8 h-32 w-32 text-white/5" />
          </div>
        </div>

      </div>
    </div>
  );
}
