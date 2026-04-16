import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    Download,
    Trophy,
    Users,
    TrendingUp,
    Search,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import api from "../../lib/api";
import clsx from "clsx";

export default function ResultsPage() {
    const [search, setSearch] = useState("");

    const { data: performance, isLoading: loadingPerf } = useQuery({
        queryKey: ["college-dashboard", "performance"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/performance");
            return res.data.data;
        },
    });

    const { data: topPerformers, isLoading: loadingTop } = useQuery({
        queryKey: ["college-dashboard", "top-performers"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/top-performers");
            return res.data.data;
        },
    });

    const { data: summary } = useQuery({
        queryKey: ["college-dashboard", "summary"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/summary");
            return res.data.data;
        },
    });

    const isLoading = loadingPerf || loadingTop;

    const filteredStudents = (topPerformers ?? []).filter((s: any) =>
        s.student?.toLowerCase().includes(search.toLowerCase())
    );

    const exportToCSV = () => {
        if (!topPerformers) return;
        const headers = ["Rank", "Student", "CGPA", "Avg Score", "Integrity"];
        const rows = topPerformers.map((s: any) => [
            s.rank, s.student, s.cgpa, s.avg_score, s.integrity,
        ]);
        const csv = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((r: any[]) => r.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `results_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Results & Reports</h1>
                    <p className="mt-1 text-slate-500 font-medium">Assessment scores, rankings, and performance analytics for your campus.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Average Score", value: `${summary?.avg_score ?? 0}%`, icon: BarChart3, color: "blue" },
                    { label: "Top Performers", value: topPerformers?.length ?? 0, icon: Trophy, color: "amber" },
                    { label: "Total Students", value: summary?.total_students ?? 0, icon: Users, color: "indigo" },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "p-3 rounded-xl",
                                kpi.color === "blue" && "bg-blue-50 text-blue-600",
                                kpi.color === "amber" && "bg-amber-50 text-amber-600",
                                kpi.color === "indigo" && "bg-indigo-50 text-indigo-600",
                            )}>
                                <kpi.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{kpi.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Score Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Score Distribution
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performance?.score_distribution ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} />
                                <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Skill Heatmap */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Skill Performance
                        </h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-3 font-bold text-slate-500 text-left">Skill Domain</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 text-right">Avg Score</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 text-right">Strength</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(performance?.skill_heatmap ?? []).map((skill: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3.5 font-bold text-slate-700">{skill.skill}</td>
                                        <td className="px-6 py-3.5 font-black text-slate-900 text-right">{skill.avg_score}%</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                                                skill.strength === "Strong" && "bg-emerald-100 text-emerald-700",
                                                skill.strength === "Average" && "bg-amber-100 text-amber-700",
                                                skill.strength === "Weak" && "bg-rose-100 text-rose-700",
                                            )}>
                                                {skill.strength}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!performance?.skill_heatmap || performance.skill_heatmap.length === 0) && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400 font-medium">No skill data available yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Top Performers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900">Student Rankings</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400">
                                <th className="px-6 py-4 font-bold text-center w-16">Rank</th>
                                <th className="px-6 py-4 font-bold">Student</th>
                                <th className="px-6 py-4 font-bold text-center">CGPA</th>
                                <th className="px-6 py-4 font-bold text-center">Avg Score</th>
                                <th className="px-6 py-4 font-bold text-right">Integrity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map((student: any) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        <span className={clsx(
                                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black",
                                            student.rank === 1 && "bg-amber-100 text-amber-600",
                                            student.rank === 2 && "bg-slate-200 text-slate-600",
                                            student.rank === 3 && "bg-orange-100 text-orange-700",
                                            student.rank > 3 && "bg-slate-100 text-slate-500",
                                        )}>
                                            {student.rank}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{student.student}</td>
                                    <td className="px-6 py-4 font-bold text-slate-600 text-center">{student.cgpa}</td>
                                    <td className="px-6 py-4 font-black text-slate-900 text-center">{student.avg_score}%</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={clsx(
                                            "font-bold",
                                            parseFloat(student.integrity) > 85 ? "text-emerald-600" : "text-amber-600"
                                        )}>
                                            {student.integrity}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">No results found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
