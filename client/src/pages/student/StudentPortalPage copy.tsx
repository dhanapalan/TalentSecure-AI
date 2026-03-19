import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { BookOpen, CheckCircle, Star, ArrowRight, Calendar } from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

const checklist = [
  { task: "Complete profile", done: true },
  { task: "System compatibility check", done: true },
  { task: "Mock test completed", done: false },
  { task: "Exam hall ticket downloaded", done: false },
  { task: "Ensure stable internet connection", done: false },
];

export default function StudentPortalPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: exams = [] } = useQuery({
    queryKey: ["student-exams", user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${user?.id ?? "stu-1"}/exams`);
      return (data as any).data as {
        id: string; title: string; duration_minutes: number; total_questions: number;
        is_active: boolean; scheduled_at: string; role_title?: string; role_company?: string;
      }[];
    },
    enabled: !!user,
  });

  const activeExam = exams.find((e) => e.is_active);
  const upcomingExams = exams.filter((e) => !e.is_active);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
        <h1 className="text-xl font-bold">Welcome back, {user?.name?.split(" ")[0] ?? "Student"} 👋</h1>
        <p className="text-emerald-200 text-sm mt-0.5">
          {user?.department ? `${user.department} · ` : ""}
          GradLogic Student Portal
        </p>
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "Exams Assigned", value: exams.length },
            { label: "Completed", value: upcomingExams.length },
            { label: "Upcoming", value: exams.filter((e) => !e.is_active).length },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-emerald-200 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active exam alert */}
      {activeExam && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-blue-700 text-xs font-semibold">EXAM AVAILABLE NOW</span>
              </div>
              <h3 className="text-slate-800 font-semibold">{activeExam.title}</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {activeExam.duration_minutes} min · {activeExam.total_questions} questions
                {activeExam.role_title && ` · ${activeExam.role_title} @ ${activeExam.role_company}`}
              </p>
            </div>
            <button
              onClick={() => navigate(`/student/exams/${activeExam.id}/take`)}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Start Exam <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Exams Assigned", value: exams.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Upcoming", value: upcomingExams.length, icon: Calendar, color: "text-amber-600 bg-amber-50" },
          { label: "Profile Status", value: "Complete", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${s.color} rounded-lg p-2.5`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exams list + checklist */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned exams */}
        <div className="rounded-xl bg-white border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Assigned Assessments</h3>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No exams assigned yet.</div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div key={exam.id} className="border border-slate-100 rounded-xl p-4 hover:border-emerald-200 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{exam.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {exam.duration_minutes} min · {exam.total_questions} questions
                        {exam.role_title && ` · ${exam.role_title}`}
                      </p>
                    </div>
                    {exam.is_active ? (
                      <button
                        onClick={() => navigate(`/student/exams/${exam.id}/take`)}
                        className="flex-shrink-0 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        Start
                      </button>
                    ) : (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Scheduled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="rounded-xl bg-white border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Pre-Exam Checklist</h3>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500" : "border-2 border-slate-200"}`}>
                  {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.task}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link to="/student-onboarding" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
              <Star className="w-4 h-4" /> Complete your profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
