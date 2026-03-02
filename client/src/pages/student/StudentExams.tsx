import { useNavigate } from "react-router";
import { exams } from "../../data/mockData";
import { Clock, ClipboardList, Calendar, ArrowRight } from "lucide-react";

export default function StudentExams() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <h3 className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>My Exams</h3>
      <div className="space-y-4">
        {exams.map((exam: any) => (
          <div key={exam.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${exam.status === "Active" ? "bg-green-50 text-green-700" : exam.status === "Scheduled" ? "bg-blue-50 text-blue-700" : exam.status === "Completed" ? "bg-gray-100 text-gray-500" : "bg-yellow-50 text-yellow-700"}`}>
                    {exam.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{exam.type}</span>
                </div>
                <h3 className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{exam.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-gray-400 text-xs">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration} min</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" />{exam.totalQuestions} Questions</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exam.scheduledDate}</span>
                </div>
              </div>
              {exam.status === "Active" && (
                <button onClick={() => navigate("/student/exam")} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 transition-colors" style={{ fontWeight: 500 }}>
                  Start <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
