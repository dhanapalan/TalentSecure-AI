import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import {
    Plus,
    Search,
    RocketIcon,
    Eye,
    XCircle,
    CheckCircle,
    Clock,
    Play,
    Send,
    Loader2,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import CreateDriveModal from "./CreateDriveModal";

// ── Types ────────────────────────────────────────────────────────────────────

interface Drive {
    id: string;
    name: string;
    rule_id: string;
    rule_name: string;
    rule_version_number: number | null;
    status: string;
    scheduled_start: string | null;
    scheduled_end: string | null;
    total_students: number;
    auto_publish: boolean;
    created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: Clock },
    generating: { label: "Generating", color: "bg-blue-100 text-blue-700", icon: Loader2 },
    scheduled: { label: "Scheduled", color: "bg-indigo-100 text-indigo-700", icon: Clock },
    active: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: Play },
    completed: { label: "Completed", color: "bg-amber-100 text-amber-700", icon: CheckCircle },
    published: { label: "Published", color: "bg-green-100 text-green-700", icon: Send },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DrivesDashboardPage() {
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fromRule = searchParams.get("from_rule");

    useEffect(() => {
        if (fromRule) {
            setIsModalOpen(true);
        }
    }, [fromRule]);

    const { data: drives = [], isLoading, refetch } = useQuery<Drive[]>({
        queryKey: ["drives", statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (fromRule) params.set("rule_id", fromRule);
            const res = await api.get(`/drives?${params.toString()}`);
            return res.data.data || [];
        },
    });

    const filtered = drives.filter((d: Drive) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || (d.rule_name || "").toLowerCase().includes(q);
    });

    const handleCancel = async (id: string) => {
        try {
            await api.post(`/drives/${id}/cancel`);
            toast.success("Drive cancelled");
            refetch();
        } catch {
            toast.error("Cancel failed");
        }
    };

    const handleGenerate = async (id: string) => {
        try {
            await api.post(`/drives/${id}/generate`);
            toast.success("Drive generated and scheduled");
            refetch();
        } catch {
            toast.error("Generation failed");
        }
    };

    const fmt = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    // Stats
    const activeCount = drives.filter((d: Drive) => d.status?.toLowerCase() === "active").length;
    const scheduledCount = drives.filter((d: Drive) => d.status?.toLowerCase() === "scheduled").length;
    const completedCount = drives.filter((d: Drive) => ["completed", "published"].includes(d.status?.toLowerCase() || "")).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <RocketIcon className="h-8 w-8 text-indigo-500" />
                        <h1 className="text-3xl font-black text-slate-900">Assessment Drives</h1>
                    </div>
                    <p className="text-sm text-slate-500 ml-11">Manage execution instances of assessment rules</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all"
                >
                    <Plus className="h-4 w-4" /> New Drive from Rule
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: "Total Drives", value: drives.length, icon: RocketIcon, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Active", value: activeCount, icon: Play, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Scheduled", value: scheduledCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
                    { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search drives..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {["all", "draft", "scheduled", "active", "completed", "published", "cancelled"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === s
                                    ? "bg-indigo-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {s === "all" ? "All" : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <RocketIcon className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-bold text-slate-400">No drives found</p>
                        <p className="text-sm text-slate-400 mt-1">Create a drive from an assessment rule</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Drive Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Rule</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Version</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Start</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">End</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Students</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((drive: Drive) => {
                                    const currentStatus = (drive.status || "draft").toLowerCase();
                                    const sc = statusConfig[currentStatus] || statusConfig.draft;
                                    return (
                                        <tr key={drive.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link to={`/app/drives/${drive.id}`} className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors">
                                                    {drive.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{drive.rule_name || "—"}</td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                                                {drive.rule_version_number ? `v${drive.rule_version_number}` : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sc.color}`}>
                                                    <sc.icon className="h-3 w-3" /> {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-500">{fmt(drive.scheduled_start)}</td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-500">{fmt(drive.scheduled_end)}</td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{drive.total_students}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link to={`/app/drives/${drive.id}`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {currentStatus === "draft" && (
                                                        <button onClick={() => handleGenerate(drive.id)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Generate">
                                                            <RocketIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {["draft", "scheduled"].includes(currentStatus) && (
                                                        <button onClick={() => handleCancel(drive.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancel">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateDriveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
                initialRuleId={fromRule}
            />
        </div>
    );
}
