import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  Users,
  FileText,
  Plus,
  Calendar,
  Clock,
  LayoutDashboard,
  UserPlus,
  Upload,
  GraduationCap
} from "lucide-react";
import clsx from "clsx";
import ExamProgressView from "../../components/ExamProgressView";

export default function CollegeDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedExam, setSelectedExam] = useState<{ id: string, title: string } | null>(null);

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ["college-stats"],
    queryFn: async () => {
      const { data } = await api.get("/colleges/stats");
      return data.data;
    }
  });

  // Fetch Students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["college-students"],
    queryFn: async () => {
      const { data } = await api.get("/colleges/students");
      return data.data;
    }
  });

  // Fetch Exams
  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: ["college-exams"],
    queryFn: async () => {
      const { data } = await api.get("/colleges/exams");
      return data.data;
    }
  });

  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "exams", label: "Assigned Exams", icon: FileText },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">College Portal</h1>
          <p className="text-gray-500 font-medium">Managing excellence for {user?.name}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-100">
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Enrolled Students</p>
              <h3 className="mt-4 text-5xl font-black">{stats?.total_students || 0}</h3>
              <Users className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10" />
            </div>
            <div className="relative overflow-hidden rounded-[2rem] bg-emerald-600 p-8 text-white shadow-xl shadow-emerald-100">
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest">Active Assessments</p>
              <h3 className="mt-4 text-5xl font-black">{stats?.active_assessments || 0}</h3>
              <FileText className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10" />
            </div>
            <div className="relative overflow-hidden rounded-[2rem] bg-gray-900 p-8 text-white shadow-xl shadow-gray-200">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Avg. Talent Score</p>
              <h3 className="mt-4 text-5xl font-black text-amber-400">{stats?.avg_cgpa?.toFixed(1) || "0.0"}</h3>
              <GraduationCap className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ── Recent Exams ── */}
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Upcoming Assessments</h3>
                <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {loadingExams ? (
                  <div className="h-20 animate-pulse rounded-2xl bg-gray-50" />
                ) : exams?.length ? (
                  exams.slice(0, 3).map((exam: any) => (
                    <div key={exam.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{exam.title}</p>
                          <p className="text-xs text-gray-400 font-medium">{exam.role_title} • {exam.role_company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">{new Date(exam.scheduled_at).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Scheduled At</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 font-medium italic">No exams scheduled for your campus.</div>
                )}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="rounded-[2.5rem] bg-gray-50 p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Administrative Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab("students")}
                  className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md active:scale-95"
                >
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <span className="text-sm font-black text-gray-900">BULK REGISTER</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md active:scale-95">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Upload className="h-8 w-8" />
                  </div>
                  <span className="text-sm font-black text-gray-900">EXPORT DATA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900">Student Registry</h3>
              <p className="text-sm text-gray-400 font-medium">List of all students registered under your college</p>
            </div>
            <button className="flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-black transition-all active:scale-95">
              <Plus className="h-5 w-5" />
              ADD NEW STUDENT
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Major/Degree</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">C.GPA</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingStudents ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6 h-12 bg-gray-50/20" />
                    </tr>
                  ))
                ) : students?.length ? (
                  students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                            {student.first_name[0]}{student.last_name[0] || ""}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-700">{student.major}</p>
                        <p className="text-xs text-gray-400 font-medium">{student.degree}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 font-black text-gray-900">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          {student.cgpa}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-gray-500">Class of {student.graduation_year}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={clsx(
                          "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          student.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                        )}>
                          {student.is_active ? "Active" : "Archived"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-200" />
                        <p className="mt-4 text-gray-500 font-medium">No students registered in this campus master yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "exams" && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900">Assigned Assessments</h3>
              <p className="text-sm text-gray-400 font-medium">Exams delegated by HR for your students</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loadingExams ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-3xl bg-gray-50" />
                ))
              ) : exams?.length ? (
                exams.map((exam: any) => (
                  <div key={exam.id} className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between">
                      <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        LIVE
                      </span>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-lg font-black text-gray-900 leading-tight">{exam.title}</h4>
                      <p className="mt-1 text-xs text-gray-400 font-bold uppercase tracking-tighter">{exam.role_company} • {exam.role_title}</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        {new Date(exam.scheduled_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs font-black text-indigo-600 hover:underline">DETAILS</button>
                        <button
                          onClick={() => setSelectedExam({ id: exam.id, title: exam.title })}
                          className="rounded-xl bg-gray-900 px-4 py-2 text-[10px] font-black text-white hover:bg-black transition-all shadow-sm"
                        >
                          MONITOR
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-500 font-bold">No assessments assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedExam && (
        <ExamProgressView
          examId={selectedExam.id}
          examTitle={selectedExam.title}
          onClose={() => setSelectedExam(null)}
          isHr={false}
        />
      )}
    </div>
  );
}
