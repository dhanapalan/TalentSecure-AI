import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import api from "../../lib/api";
import {
    Activity,
    ShieldAlert,
    ShieldCheck,
    Search,
    AlertTriangle,
    Eye,
    Clock,
    RefreshCw,
    Camera,
    Lock,
    Users,
    Monitor,
    Wifi,
    XCircle,
    Zap,
    Radio,
    BarChart2,
} from "lucide-react";
import { useState } from "react";
import PerStudentLiveView from "../../components/PerStudentLiveView";
import EventStream from "../../components/EventStream";
import ViolationHeatmap from "../../components/ViolationHeatmap";

type Tab = "sessions" | "per_student" | "events" | "heatmap";

const CAPABILITIES = [
    {
        icon: Camera,
        title: "Face Verification",
        desc: "Real-time face matching against reference photo using AI",
        status: "active" as const,
    },
    {
        icon: Lock,
        title: "Browser Lockdown",
        desc: "Prevents tab switching, copy/paste, right-click, and DevTools",
        status: "active" as const,
    },
    {
        icon: Users,
        title: "Multi-face Detection",
        desc: "Detects additional persons in the webcam frame",
        status: "active" as const,
    },
    {
        icon: Monitor,
        title: "Screen Share Detection",
        desc: "Prevents screen sharing during assessments",
        status: "active" as const,
    },
    {
        icon: Wifi,
        title: "Network Anomaly",
        desc: "Monitors for suspicious network patterns (VPN, proxy)",
        status: "beta" as const,
    },
    {
        icon: XCircle,
        title: "Auto-termination",
        desc: "Automatically terminates session after max violations",
        status: "active" as const,
    },
];

export default function LiveMonitoringDashboard() {
    const { driveId } = useParams<{ driveId: string }>();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("sessions");

    // Poll for live monitoring data every 5 seconds
    const { data: rawSessions, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["live-monitoring", driveId],
        queryFn: async () => {
            const endpoint = driveId ? `/proctoring/live?driveId=${driveId}` : `/proctoring/live`;
            const { data } = await api.get(endpoint);
            return data.data;
        },
        refetchInterval: 5000,
    });

    // Pull platform integrity metric
    const { data: metrics } = useQuery({
        queryKey: ["dashboard-metrics"],
        queryFn: async () => {
            const { data } = await api.get("/analytics/dashboard");
            return data.data;
        },
    });

    const sessions = rawSessions || [];

    const filteredSessions = sessions.filter((s: any) =>
        (s.studentName ?? s.studentId ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.driveName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const highRiskCount = sessions.filter((s: any) => s.integrityScore < 50 || s.status === "terminated").length;
    const warningCount = sessions.filter((s: any) => s.integrityScore >= 50 && s.integrityScore < 80 && s.status !== "terminated").length;

    const avgIntegrity = sessions.length > 0
        ? Math.round(sessions.reduce((acc: number, s: any) => acc + s.integrityScore, 0) / sessions.length)
        : (metrics?.avgProctoringIntegrity ?? 100);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "N/A";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "sessions", label: "Live Sessions", icon: Activity },
        { id: "per_student", label: "Per-Student View", icon: Camera },
        { id: "events", label: "Event Stream", icon: Radio },
        { id: "heatmap", label: "Violation Heatmap", icon: BarChart2 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Live Monitoring</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {driveId ? `Drive ID: ${driveId}` : "All Active Drives"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Sessions</p>
                        <p className="text-2xl font-black text-gray-900">{sessions.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">High Risk</p>
                        <p className="text-2xl font-black text-gray-900">{highRiskCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Warnings</p>
                        <p className="text-2xl font-black text-gray-900">{warningCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Integrity</p>
                        <p className="text-2xl font-black text-gray-900">{avgIntegrity}%</p>
                    </div>
                </div>
            </div>

            {/* System Capabilities */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-base font-black text-gray-900">System Capabilities</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CAPABILITIES.map((cap) => (
                        <div key={cap.title} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                <cap.icon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-xs font-black text-gray-800">{cap.title}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                        cap.status === "active"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {cap.status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-snug">{cap.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabbed Views */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">

                {/* Tab bar */}
                <div className="border-b border-gray-100 px-6 pt-5 pb-0">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl whitespace-nowrap transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-indigo-600 text-indigo-600 bg-indigo-50/60"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab: Live Sessions Table */}
                {activeTab === "sessions" && (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Students</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or drive..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[280px]"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Student</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Drive Name</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Time Left</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Violations</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Integrity</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
                                            </td>
                                        </tr>
                                    ) : filteredSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                                                No active sessions found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSessions.map((session: any) => {
                                            const isHighRisk = session.integrityScore < 50 || session.status === "terminated";
                                            const isWarning = session.integrityScore >= 50 && session.integrityScore < 80;

                                            return (
                                                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            {session.studentName ?? `${session.studentId?.substring(0, 8)}…`}
                                                        </p>
                                                        {session.studentName && (
                                                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                                {session.studentId?.substring(0, 8)}…
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                                        {session.driveName}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                                            ${session.status === "in_progress" ? "bg-indigo-50 text-indigo-600" :
                                                                session.status === "terminated" ? "bg-red-50 text-red-600" :
                                                                    "bg-gray-100 text-gray-600"}`}>
                                                            {session.status.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                                        <span className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTime(session.timeRemaining)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-black text-sm
                                                            ${session.violations === 0 ? "bg-gray-100 text-gray-600" :
                                                                session.violations < 3 ? "bg-amber-100 text-amber-700" :
                                                                    "bg-red-100 text-red-700"}`}>
                                                            {session.violations}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2.5 w-2.5 rounded-full
                                                                ${isHighRisk ? "bg-red-500 animate-pulse" :
                                                                    isWarning ? "bg-amber-500" : "bg-emerald-500"}`} />
                                                            <span className={`font-black ${isHighRisk ? "text-red-700" : isWarning ? "text-amber-700" : "text-emerald-700"}`}>
                                                                {session.integrityScore}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            to={`/app/admin/monitoring/session/${session.id}`}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Tab: Per-Student Live View */}
                {activeTab === "per_student" && (
                    <div className="p-6">
                        <PerStudentLiveView />
                    </div>
                )}

                {/* Tab: Event Stream */}
                {activeTab === "events" && (
                    <div className="p-6">
                        <EventStream />
                    </div>
                )}

                {/* Tab: Violation Heatmap */}
                {activeTab === "heatmap" && (
                    <div className="p-6">
                        <ViolationHeatmap />
                    </div>
                )}
            </div>
        </div>
    );
}
