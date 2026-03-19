import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import {
    Plus,
    Search,
    ClipboardList,
    Settings,
    Copy,
    Edit2,
    RocketIcon,
    Archive,
    CheckCircle,
    Clock,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface Rule {
    id: string;
    name: string;
    description: string | null;
    target_role: string | null;
    duration_minutes: number;
    total_questions: number;
    total_marks: number;
    skill_distribution: Record<string, number>;
    difficulty_distribution: Record<string, number>;
    proctoring_mode: string;
    status: string;
    version: number;
    created_at: string;
    updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    active_template: { label: "Active Template", color: "bg-green-100 text-green-800", icon: CheckCircle },
    archived: { label: "Archived", color: "bg-slate-100 text-slate-600", icon: Archive },
};

function skillSummary(dist: Record<string, number>) {
    return Object.entries(dist || {})
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k.replace(/_/g, " ")} ${v}%`)
        .join(", ") || "—";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RuleDashboardPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: rules = [], isLoading, refetch } = useQuery<Rule[]>({
        queryKey: ["assessment-rules", statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            const res = await api.get(`/assessment-rules?${params.toString()}`);
            return res.data.data || [];
        },
    });

    const filtered = rules.filter((r: Rule) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.name.toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q) ||
            (r.target_role || "").toLowerCase().includes(q)
        );
    });

    const handleClone = async (id: string) => {
        try {
            await api.post(`/assessment-rules/${id}/clone`);
            toast.success("Rule cloned");
            refetch();
        } catch {
            toast.error("Clone failed");
        }
    };

    const handleLaunchDrive = (ruleId: string) => {
        navigate(`/app/drives?from_rule=${ruleId}`);
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Are you sure you want to archive this rule? It will no longer be available for new drives.")) return;
        try {
            await api.post(`/assessment-rules/${id}/archive`);
            toast.success("Rule archived");
            refetch();
        } catch {
            toast.error("Archive failed");
        }
    };

    // Stats
    const totalRules = rules.length;
    const activeRules = rules.filter((r: Rule) => r.status === "active_template").length;
    const draftRules = rules.filter((r: Rule) => r.status === "draft").length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Settings className="h-8 w-8 text-amber-500" />
                        <h1 className="text-3xl font-black text-slate-900">Assessment Rules</h1>
                    </div>
                    <p className="text-sm text-slate-500 ml-11">Configure assessment templates and rule sets</p>
                </div>
                <Link
                    to="/app/assessment-rules/new"
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all"
                >
                    <Plus className="h-4 w-4" /> Create Rule
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {[
                    { label: "Total Rules", value: totalRules, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
                    { label: "Active Templates", value: activeRules, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Drafts", value: draftRules, icon: Clock, color: "text-amber-600 bg-amber-50" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${s.color}`}>
                                <s.icon className="h-5 w-5" />
                            </div>
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
                            placeholder="Search rules..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "draft", "active_template", "archived"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === s
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {s === "all" ? "All" : s.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ClipboardList className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-bold text-slate-400">No rules found</p>
                        <p className="text-sm text-slate-400 mt-1">Create your first assessment rule to get started</p>
                        <Link
                            to="/app/assessment-rules/new"
                            className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-all"
                        >
                            <Plus className="h-4 w-4" /> Create First Rule
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Rule Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Skills Mix</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Duration</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Questions</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Proctoring</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Version</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((rule: Rule) => {
                                    const sc = statusConfig[rule.status] || statusConfig.draft;
                                    return (
                                        <tr key={rule.id} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{rule.name}</p>
                                                    {rule.description && (
                                                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{rule.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-600 max-w-[200px] truncate">
                                                    {skillSummary(rule.skill_distribution)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700">{rule.duration_minutes}m</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700">{rule.total_questions}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 capitalize">
                                                    {rule.proctoring_mode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700">v{rule.version}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sc.color}`}>
                                                    <sc.icon className="h-3 w-3" />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        to={`/app/assessment-rules/${rule.id}`}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleClone(rule.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Clone"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLaunchDrive(rule.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title="Launch Drive"
                                                    >
                                                        <RocketIcon className="h-4 w-4" />
                                                    </button>
                                                    {rule.status !== "archived" && (
                                                        <button
                                                            onClick={() => handleArchive(rule.id)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                                            title="Archive"
                                                        >
                                                            <Archive className="h-4 w-4" />
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
        </div>
    );
}
