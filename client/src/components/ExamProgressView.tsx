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
    Filter
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
        IN_PROGRESS: "bg-amber-50 text-amber-600 border-amber-100",
        COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
        TERMINATED: "bg-red-50 text-red-600 border-red-100",
        null: "bg-gray-50 text-gray-400 border-gray-100",
        undefined: "bg-gray-50 text-gray-400 border-gray-100"
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                {/* ── Header ── */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-2xl font-black text-gray-900">Live Progress: {examTitle}</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Real-time monitoring and administrative oversight</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isHr && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to terminate this exam globally? This will stop all active sessions.")) {
                                        terminateGlobal.mutate();
                                    }
                                }}
                                className="flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 transition-all"
                            >
                                <StopCircle className="h-4 w-4" />
                                STOP GLOBAL
                            </button>
                        )}
                        <button onClick={onClose} className="rounded-2xl bg-gray-100 p-2.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search student by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border-none bg-white pl-12 pr-4 py-3.5 text-sm font-medium shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-2xl border-none bg-white px-4 py-3.5 text-sm font-bold shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="TERMINATED">Terminated</option>
                            <option value="not_started">Not Started</option>
                        </select>
                    </div>
                </div>

                {/* ── Student List ── */}
                <div className="flex-1 overflow-auto p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <RefreshCcw className="h-10 w-10 text-indigo-500 animate-spin" />
                            <p className="font-bold text-gray-400 tracking-widest text-xs">SYNCHRONIZING LIVE DATA...</p>
                        </div>
                    ) : filteredStudents?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStudents.map((s: any) => (
                                <div key={s.student_profile_id} className="group rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm hover:border-indigo-100 hover:shadow-xl transition-all relative overflow-hidden">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 leading-tight">{s.first_name} {s.last_name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.campus_name}</p>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                                            statusColors[s.session_status] || statusColors.null
                                        )}>
                                            {s.session_status || "NOT STARTED"}
                                        </div>
                                    </div>

                                    {s.session_id && (
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                    <Clock className="h-3 w-3" /> Started At
                                                </span>
                                                <span className="font-bold text-gray-900">{new Date(s.started_at).toLocaleTimeString()}</span>
                                            </div>
                                            {s.violation_count > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                        <AlertTriangle className="h-3 w-3" /> Violations
                                                    </span>
                                                    <span className="rounded-full bg-red-600 px-2 py-0.5 font-black text-white">{s.violation_count}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!s.session_id && (
                                        <div className="mt-8 py-4 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                            <Clock className="h-6 w-6 text-gray-200" />
                                            <p className="mt-2 text-[10px] font-black text-gray-300 uppercase">Awaiting Login</p>
                                        </div>
                                    )}

                                    {/* ── Controls ── */}
                                    {s.session_id && s.session_status === 'IN_PROGRESS' && (
                                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Terminate exam for ${s.first_name}?`)) {
                                                        terminateStudent.mutate(s.session_id);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                            >
                                                <StopCircle className="h-3 w-3" />
                                                STOP
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Reset exam for ${s.first_name}? All progress will be lost.`)) {
                                                        resetStudent.mutate(s.session_id);
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 px-4 text-[10px] font-black text-gray-500 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                            >
                                                <RefreshCcw className="h-3 w-3" />
                                                RESET
                                            </button>
                                        </div>
                                    )}

                                    {s.session_status === 'COMPLETED' && (
                                        <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col items-center justify-center">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-emerald-600">{s.score || 0}</span>
                                                <span className="text-xs font-bold text-gray-400">/ 100</span>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Final Score</p>
                                        </div>
                                    )}

                                    {s.session_status === 'TERMINATED' && (
                                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-4">
                                            <button
                                                onClick={() => resetStudent.mutate(s.session_id)}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-[10px] font-black text-white hover:bg-black transition-all shadow-lg"
                                            >
                                                <RefreshCcw className="h-3 w-3" />
                                                ALLOW RE-TAKE
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <User className="h-16 w-16 text-gray-100" />
                            <p className="mt-4 font-bold">No students found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-6 bg-gray-100/50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-12">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            {students?.filter((s: any) => s.session_status === 'IN_PROGRESS').length || 0} Taking Exam
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            {students?.filter((s: any) => s.session_status === 'COMPLETED').length || 0} Completed
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            {students?.filter((s: any) => s.session_status === 'TERMINATED').length || 0} Terminated
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <RefreshCcw className="h-3 w-3 animate-spin" />
                        Auto-Refreshing Live
                    </div>
                </div>
            </div>
        </div>
    );
}
