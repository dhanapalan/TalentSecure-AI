import { useNavigate } from "react-router";
import { exams, studentResults } from "../../data/mockData";
import { CheckCircle, Clock, ArrowRight, Star } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const upcomingExam = exams.find((e: any) => e.status === "Active");
  const avgScore = studentResults.reduce((a: number, r: any) => a + r.score, 0) / (studentResults.length || 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>Welcome back, Arjun! 👋</h2>
        <p className="text-emerald-200 text-sm mt-1">IIT Delhi · B.Tech CSE · Roll No: CS21001</p>
        <div className="flex items-center gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl" style={{ fontWeight: 700 }}>3</div>
            <div className="text-emerald-200 text-xs">Exams Taken</div>
          </div>
          <div className="w-px h-10 bg-emerald-400/50" />
          <div className="text-center">
            <div className="text-2xl" style={{ fontWeight: 700 }}>{avgScore.toFixed(0)}%</div>
            <div className="text-emerald-200 text-xs">Avg Score</div>
          </div>
          <div className="w-px h-10 bg-emerald-400/50" />
          <div className="text-center">
            <div className="text-2xl" style={{ fontWeight: 700 }}>8.7</div>
            <div className="text-emerald-200 text-xs">CGPA</div>
          </div>
        </div>
      </div>

      {/* Active Exam Alert */}
      {upcomingExam && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-blue-700 text-xs" style={{ fontWeight: 600 }}>EXAM ACTIVE NOW</span>
              </div>
              <h3 className="text-gray-800 text-base" style={{ fontWeight: 600 }}>{upcomingExam.title}</h3>
              <p className="text-gray-500 text-xs mt-0.5">{upcomingExam.duration} minutes · {upcomingExam.totalQuestions} Questions · Cutoff: {upcomingExam.cutoff}%</p>
            </div>
            <button
              onClick={() => navigate("/student/exam")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              Start Exam <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Exams Completed", value: studentResults.length, icon: CheckCircle, color: "emerald" },
          { label: "Best Score", value: `${studentResults.length ? Math.max(...studentResults.map((r: any) => r.score)) : 0}%`, icon: Star, color: "yellow" },
          { label: "Upcoming Exams", value: exams.filter((e: any) => e.status === "Scheduled").length, icon: Clock, color: "blue" },
        ].map(s => {
          const Icon = s.icon;
          const colors: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-600", yellow: "bg-yellow-50 text-yellow-600", blue: "bg-blue-50 text-blue-600" };
          const texts: Record<string, string> = { emerald: "text-emerald-600", yellow: "text-yellow-600", blue: "text-blue-600" };
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${colors[s.color]} p-2.5 rounded-lg`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className={`text-2xl ${texts[s.color]}`} style={{ fontWeight: 700 }}>{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Results */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Recent Results</h3>
          <button onClick={() => navigate("/student/results")} className="text-emerald-600 text-xs hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {studentResults.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`} style={{ fontWeight: 700 }}>
                  {r.score}
                </div>
                <div>
                  <p className="text-gray-800 text-sm" style={{ fontWeight: 500 }}>{r.examName}</p>
                  <p className="text-gray-400 text-xs">{r.date} · Rank #{r.rank} · {r.percentile}%ile</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full ${r.status === "Pass" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`} style={{ fontWeight: 500 }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-gray-900 text-sm mb-4" style={{ fontWeight: 600 }}>Exam Preparation Checklist</h3>
        <div className="space-y-2">
          {[
            { task: "Complete profile", done: true },
            { task: "System compatibility check", done: true },
            { task: "Mock test completed", done: true },
            { task: "Exam hall ticket downloaded", done: false },
            { task: "Ensure stable internet connection", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500" : "border-2 border-gray-200"}`}>
                {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
