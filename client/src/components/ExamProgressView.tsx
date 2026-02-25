import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
    X,
    RefreshCcw,
    StopCircle,
    User,
    AlertTriangle,
    Clock,
    Search,
    Filter,
    Activity
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";

interface ExamProgressViewProps {
    examId: string;
    examTitle: string;
    onClose: () => void;
    campusId?: string; // Optional: if provided, filters by campus (for college staff)
    isHr?: boolean;    // If true, shows HR-specific controls like global stop
}

export default function ExamProgressView({ examId, examTitle, onClose, campusId, isHr }: ExamProgressViewProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch Live Progress
    const { data: students, isLoading } = useQuery({
        queryKey: ["exam-progress", examId, campusId],
        queryFn: async () => {
            const { data } = await api.get(`/exams/${examId}/progress`, {
                params: { campusId }
            });
            return data.data;
        },
        refetchInterval: 5000 // Auto-refresh every 5s
    });

    // Mutations
    const terminateGlobal = useMutation({
        mutationFn: () => api.post(`/exams/${examId}/terminate`),
        onSuccess: () => {
            toast.success("Exam terminated globally");
            queryClient.invalidateQueries({ queryKey: ["exam-progress", examId] });
        }
    });

    const terminateStudent = useMutation({
        mutationFn: (sessionId: string) => api.post(`/exams/${examId}/sessions/${sessionId}/terminate`),
        onSuccess: () => {
            toast.success("Student session terminated");
            queryClient.invalidateQueries({ queryKey: ["exam-progress", examId] });
        }
    });

    const resetStudent = useMutation({
        mutationFn: (sessionId: string) => api.post(`/exams/${examId}/sessions/${sessionId}/reset`),
        onSuccess: () => {
            toast.success("Student session reset successfully");
            queryClient.invalidateQueries({ queryKey: ["exam-progress", examId] });
        }
    });

    const filteredStudents = students?.filter((s: any) => {
        const matchesSearch = (s.first_name + " " + s.last_name + " " + s.email).toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || s.session_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusColors: any = {
        IN_PROGRESS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        TERMINATED: "bg-red-500/10 text-red-500 border-red-500/20",
        null: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        undefined: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-12">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full h-full max-w-[1400px] overflow-hidden rounded-[3rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
                {/* ── Header ── */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                            <Activity className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Signal: {examTitle}</h2>
                            </div>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Global Terminal Live Stream</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isHr && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to terminate this exam globally? This will stop all active sessions.")) {
                                        terminateGlobal.mutate();
                                    }
                                }}
                                className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-xs font-black text-white hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                            >
                                <StopCircle className="h-4 w-4" />
                                TERMINATE GLOBAL SIGNAL
                            </button>
                        )}
                        <button onClick={onClose} className="rounded-2xl bg-slate-100 p-4 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex flex-wrap items-center gap-6">
                    <div className="relative flex-1 min-w-[400px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find student via UID or Metadata..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-[1.5rem] border-none bg-white pl-14 pr-6 py-4 text-sm font-bold shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm ring-1 ring-slate-200">
                        <span className="flex items-center gap-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Filter className="h-3.5 w-3.5" />
                            Status Filter
                        </span>
                        <div className="flex gap-1 p-1">
                            {['all', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={clsx(
                                        "rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        statusFilter === status
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "hover:bg-slate-50 text-slate-400"
                                    )}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Student List ── */}
                <div className="flex-1 overflow-auto p-10 bg-white/30 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="relative flex h-20 w-20 items-center justify-center">
                                <RefreshCcw className="h-12 w-12 text-indigo-500 animate-spin" />
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-[spin_2s_linear_infinite]" />
                            </div>
                            <p className="font-black text-slate-300 tracking-[0.3em] text-[10px]">INITIALIZING QUANTUM ENCRYPTION...</p>
                        </div>
                    ) : filteredStudents?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredStudents.map((s: any) => (
                                <div key={s.student_profile_id} className="group relative rounded-[2.5rem] border border-slate-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-indigo-100 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] transition-all overflow-hidden">
                                    <div className="absolute top-0 left-0 h-1 w-full opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-200">
                                                <User className="h-7 w-7" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-slate-900 leading-tight truncate">{s.first_name} {s.last_name}</h4>
                                                <p className="mt-1 text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{s.campus_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-8">
                                        <div className={clsx(
                                            "rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest",
                                            statusColors[s.session_status] || statusColors.null
                                        )}>
                                            {s.session_status || "OFFLINE"}
                                        </div>
                                        {s.violation_count > 0 && (
                                            <div className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 shadow-lg shadow-red-500/20">
                                                <AlertTriangle className="h-3 w-3 text-white" />
                                                <span className="text-[10px] font-black text-white">{s.violation_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    {s.session_id && (
                                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="h-3 w-3" /> LOGIN
                                                </span>
                                                <span className="font-black text-slate-900">{new Date(s.started_at).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!s.session_id && (
                                        <div className="py-6 flex flex-col items-center justify-center bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                                            <div className="relative h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                                                <div className="h-full w-1/3 bg-slate-300 animate-[shimmer_1.5s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                                            </div>
                                            <p className="mt-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Pulse</p>
                                        </div>
                                    )}

                                    {/* ── Quick Controls ── */}
                                    {s.session_id && s.session_status === 'IN_PROGRESS' && (
                                        <div className="mt-8 flex gap-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Terminate exam for ${s.first_name}?`)) {
                                                        terminateStudent.mutate(s.session_id);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[10px] font-black text-white hover:bg-red-600 transition-all shadow-lg active:scale-95"
                                            >
                                                TERMINATE
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Reset exam for ${s.first_name}? All progress will be lost.`)) {
                                                        resetStudent.mutate(s.session_id);
                                                    }
                                                }}
                                                className="flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3.5 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                                            >
                                                <RefreshCcw className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {s.session_status === 'COMPLETED' && (
                                        <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center justify-center">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-emerald-500">{s.score || 0}</span>
                                                <span className="text-xs font-bold text-slate-300">/ 100</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">METRIC RESULT</p>
                                        </div>
                                    )}

                                    {s.session_status === 'TERMINATED' && (
                                        <div className="mt-8 pt-6 border-t border-slate-50">
                                            <button
                                                onClick={() => resetStudent.mutate(s.session_id)}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-[10px] font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <RefreshCcw className="h-3.5 w-3.5" />
                                                RE-ESTABLISH SIGNAL
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-200">
                            <Activity className="h-24 w-24 opacity-20" />
                            <p className="mt-6 text-xl font-bold text-slate-400">No active signal matches your parameters.</p>
                            <p className="mt-1 font-medium text-slate-300">Try adjusting your filters or search criteria.</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-10 py-8 bg-slate-900 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            <span className="text-white">{students?.filter((s: any) => s.session_status === 'IN_PROGRESS').length || 0}</span> ACTIVE STREAMS
                        </div>
                        <div className="flex items-center gap-3 border-l border-white/10 pl-10">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <span className="text-white">{students?.filter((s: any) => s.session_status === 'COMPLETED').length || 0}</span> SECURED RESULTS
                        </div>
                        <div className="flex items-center gap-3 border-l border-white/10 pl-10">
                            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            <span className="text-white">{students?.filter((s: any) => s.session_status === 'TERMINATED').length || 0}</span> TERMINATED
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-full bg-white/5 px-6 py-2 border border-white/10">
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                        LIVE SYNC NOMINAL
                    </div>
                </div>
            </div>
        </div>
    );
}
