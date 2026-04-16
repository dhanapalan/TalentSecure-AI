import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    Briefcase,
    Users,
    BarChart3,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import api from "../../lib/api";
import clsx from "clsx";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function InsightsPage() {
    const { data: performance, isLoading: loadingPerf } = useQuery({
        queryKey: ["college-dashboard", "performance"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/performance");
            return res.data.data;
        },
    });

    const { data: placement, isLoading: loadingPlacement } = useQuery({
        queryKey: ["college-dashboard", "placement"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/placement");
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

    const { data: integrity } = useQuery({
        queryKey: ["college-dashboard", "integrity"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/integrity");
            return res.data.data;
        },
    });

    if (loadingPerf || loadingPlacement) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    const funnelData = placement?.funnel
        ? [
            { name: "Appeared", value: placement.funnel.appeared },
            { name: "Passed", value: placement.funnel.passed },
            { name: "Shortlisted", value: placement.funnel.shortlisted },
            { name: "Offered", value: placement.funnel.offered },
            { name: "Joined", value: placement.funnel.joined },
        ]
        : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campus Insights</h1>
                <p className="mt-1 text-slate-500 font-medium">Analytics trends, placement pipeline, and skill intelligence for your campus.</p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Avg Score", value: `${summary?.avg_score ?? 0}%`, icon: BarChart3, color: "blue" },
                    { label: "Avg Integrity", value: `${summary?.avg_integrity ?? 0}%`, icon: TrendingUp, color: "emerald" },
                    { label: "Placement Rate", value: `${summary?.placement_conversion ?? 0}%`, icon: Briefcase, color: "purple" },
                    { label: "Total Students", value: summary?.total_students ?? 0, icon: Users, color: "indigo" },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "p-3 rounded-xl",
                                kpi.color === "blue" && "bg-blue-50 text-blue-600",
                                kpi.color === "emerald" && "bg-emerald-50 text-emerald-600",
                                kpi.color === "purple" && "bg-purple-50 text-purple-600",
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

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
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
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Integrity Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Integrity Trend (Last 5 Drives)
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={integrity?.trend ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="drive_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + "…" : v} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                                <Line type="monotone" dataKey="avg_integrity" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Placement Funnel + Skill Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placement Funnel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        Placement Pipeline
                    </h2>
                    {funnelData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={funnelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                                        {funnelData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "600" }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center">
                            <p className="text-sm text-slate-400 font-medium">No placement data available yet.</p>
                        </div>
                    )}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { label: "Appeared", value: placement?.funnel?.appeared ?? 0 },
                            { label: "Offered", value: placement?.funnel?.offered ?? 0 },
                            { label: "Joined", value: placement?.funnel?.joined ?? 0 },
                        ].map((item) => (
                            <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                                <p className="text-xl font-black text-slate-900 mt-1">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skill Heatmap */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-black text-slate-900">Skill Heatmap</h2>
                    </div>
                    <div className="flex-1 overflow-auto p-6 space-y-4">
                        {(performance?.skill_heatmap ?? []).map((skill: any, idx: number) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-700">{skill.skill}</span>
                                    <span className="text-sm font-black text-slate-900">{skill.avg_score}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all",
                                            skill.strength === "Strong" && "bg-emerald-500",
                                            skill.strength === "Average" && "bg-amber-400",
                                            skill.strength === "Weak" && "bg-rose-500",
                                        )}
                                        style={{ width: `${skill.avg_score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!performance?.skill_heatmap || performance.skill_heatmap.length === 0) && (
                            <p className="text-sm text-slate-400 font-medium text-center py-8">No skill data available yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
