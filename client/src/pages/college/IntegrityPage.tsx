import { useQuery } from "@tanstack/react-query";
import {
    ShieldAlert,
    AlertTriangle,
    Users,
    TrendingDown,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import api from "../../lib/api";
import clsx from "clsx";

export default function IntegrityPage() {
    const { data: integrity, isLoading } = useQuery({
        queryKey: ["college-dashboard", "integrity"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/integrity");
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    const riskSummary = integrity?.risk_summary ?? {};
    const trend = integrity?.trend ?? [];
    const violationBreakdown = integrity?.violation_breakdown ?? [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Integrity Deep Dive</h1>
                <p className="mt-1 text-slate-500 font-medium">Proctoring violations, risk analysis, and academic integrity for your campus.</p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Avg Integrity", value: `${summary?.avg_integrity ?? 0}%`, icon: ShieldAlert, color: "emerald" },
                    { label: "High Risk Students", value: riskSummary.high_risk_students ?? 0, icon: AlertTriangle, color: "rose" },
                    { label: "Total Violations", value: riskSummary.total_violations ?? 0, icon: TrendingDown, color: "amber" },
                    { label: "Total Students", value: summary?.total_students ?? 0, icon: Users, color: "indigo" },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "p-3 rounded-xl",
                                kpi.color === "emerald" && "bg-emerald-50 text-emerald-600",
                                kpi.color === "rose" && "bg-rose-50 text-rose-600",
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Integrity Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-emerald-500" />
                        Integrity Trend (Last 5 Drives)
                    </h2>
                    <div className="h-64">
                        {trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="drive_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} dy={10} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + "…" : v} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                                    <Line type="monotone" dataKey="avg_integrity" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-slate-400 font-medium">No trend data available yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Violation Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        Violation Breakdown
                    </h2>
                    <div className="h-64">
                        {violationBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={violationBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} />
                                    <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} width={110} tickFormatter={(v: string) => v.replace(/_/g, " ")} />
                                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-slate-400 font-medium">No violations recorded.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Risk Summary Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
                    <div className="flex items-center gap-2 mb-5 text-rose-700">
                        <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
                        <h2 className="text-base font-black">Risk Summary</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/60 rounded-xl p-4 border border-rose-100/50">
                            <span className="text-sm font-bold text-rose-700/80">High Risk Students</span>
                            <span className="text-2xl font-black text-rose-700">{riskSummary.high_risk_students ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/60 rounded-xl p-4 border border-rose-100/50">
                            <span className="text-sm font-bold text-rose-700/80">Total Violations</span>
                            <span className="text-2xl font-black text-rose-700">{riskSummary.total_violations ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/60 rounded-xl p-4 border border-rose-100/50">
                            <span className="text-sm font-bold text-rose-700/80">Avg Risk Score</span>
                            <span className="text-2xl font-black text-rose-700">{riskSummary.avg_risk_score ?? "0.00"}</span>
                        </div>
                    </div>
                </div>

                {/* Per-drive integrity scores */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-black text-slate-900">Drive-wise Integrity Scores</h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                    <th className="px-6 py-4 font-bold">Drive</th>
                                    <th className="px-6 py-4 font-bold text-center">Avg Integrity</th>
                                    <th className="px-6 py-4 font-bold text-right">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {trend.map((drive: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{drive.drive_name}</td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900">{drive.avg_integrity}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                                                parseFloat(drive.avg_integrity) >= 85 && "bg-emerald-100 text-emerald-700",
                                                parseFloat(drive.avg_integrity) >= 70 && parseFloat(drive.avg_integrity) < 85 && "bg-amber-100 text-amber-700",
                                                parseFloat(drive.avg_integrity) < 70 && "bg-rose-100 text-rose-700",
                                            )}>
                                                {parseFloat(drive.avg_integrity) >= 85 ? "Good" : parseFloat(drive.avg_integrity) >= 70 ? "Fair" : "Poor"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {trend.length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">No drive data available yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
