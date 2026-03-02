import { studentResults } from "../../data/mockData";
import { Trophy, TrendingUp, CheckCircle, Download } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const sectionData = [
  { subject: "Quantitative", score: 78 },
  { subject: "Logical", score: 72 },
  { subject: "Verbal", score: 82 },
  { subject: "Technical", score: 85 },
];

export default function StudentResults() {
  const best = Math.max(...studentResults.map((r: any) => r.score));
  const avg = (studentResults.reduce((a: number, r: any) => a + r.score, 0) / studentResults.length).toFixed(1);

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Best Score", value: `${best}%`, icon: Trophy, color: "yellow" },
          { label: "Average Score", value: `${avg}%`, icon: TrendingUp, color: "blue" },
          { label: "Exams Passed", value: `${studentResults.filter((r: any) => r.status === "Pass").length}/${studentResults.length}`, icon: CheckCircle, color: "emerald" },
        ].map(s => {
          const Icon = s.icon;
          const colors: Record<string, string> = { yellow: "bg-yellow-50 text-yellow-600", blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600" };
          const texts: Record<string, string> = { yellow: "text-yellow-600", blue: "text-blue-600", emerald: "text-emerald-600" };
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${colors[s.color]} p-2.5 rounded-lg`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                  <p className={`text-2xl font-bold ${texts[s.color]}`}>{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {studentResults.map((r: any, i: number) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${r.status === "Pass" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {r.status}
                    </span>
                    <span className="text-gray-400 text-xs">{r.date}</span>
                  </div>
                  <h3 className="text-gray-900 text-base font-semibold">{r.examName}</h3>
                  <p className="text-gray-500 text-xs mt-1">Cutoff: {r.cutoff}% · Rank: #{r.rank} · Percentile: {r.percentile}%ile</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-extrabold ${r.status === "Pass" ? "text-emerald-600" : "text-red-500"}`}>
                    {r.score}
                  </div>
                  <div className="text-gray-400 text-xs">/ {r.maxScore} marks</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2 relative">
                  <div
                    className={`h-2 rounded-full transition-all ${r.status === "Pass" ? "bg-emerald-500" : "bg-red-400"}`}
                    style={{ width: `${r.score}%` }}
                    aria-label="Score progress bar"
                  />
                  {/* Cutoff marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400"
                    style={{ left: `${r.cutoff}%` }}
                    aria-label="Cutoff marker"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span className="text-amber-500">Cutoff {r.cutoff}%</span>
                  <span>{r.maxScore}</span>
                </div>
              </div>

              {/* Section scores */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {sectionData.map(s => (
                  <div key={s.subject} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-gray-800 text-sm font-bold">{s.score}%</div>
                    <div className="text-gray-400 text-xs">{s.subject}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-gray-900 text-sm mb-4 font-semibold">Skills Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={sectionData}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Tooltip wrapperStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 text-sm font-semibold">Certificate & Downloads</h3>
          </div>
          <div className="space-y-3">
            {studentResults.filter((r: any) => r.status === "Pass").map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs font-medium">{r.examName}</p>
                    <p className="text-gray-400 text-xs">Score: {r.score}% · Rank #{r.rank}</p>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
