import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import {
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    ArrowLeft,
    TerminalSquare,
    CheckCircle2,
    Clock,
    Activity,
    MonitorOff,
    Copy,
    MousePointer2,
    EyeOff
} from "lucide-react";
import { useState } from "react";

export default function StudentSessionDetail() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [notes, setNotes] = useState("");
    const [terminateReason, setTerminateReason] = useState("");
    const [showTerminateModal, setShowTerminateModal] = useState(false);

    // Fetch timeline and session details
    const { data: details, isLoading } = useQuery({
        queryKey: ["session-timeline", sessionId],
        queryFn: async () => {
            const { data } = await api.get(`/proctoring/session/${sessionId}/timeline`);
            return data.data;
        },
        enabled: !!sessionId,
        refetchInterval: 5000 // Poll every 5s while viewing
    });

    const clearIncidentMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/proctoring/session/${sessionId}/clear`, { notes });
        },
        onSuccess: () => {
            setNotes("");
            queryClient.invalidateQueries({ queryKey: ["session-timeline", sessionId] });
        }
    });

    const terminateMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/proctoring/session/${sessionId}/terminate`, { reason: terminateReason });
        },
        onSuccess: () => {
            setShowTerminateModal(false);
            queryClient.invalidateQueries({ queryKey: ["session-timeline", sessionId] });
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            </div>
        );
    }

    const { events = [], incident, summary } = details || {};
    const isHighRisk = summary?.integrity_score < 50 || summary?.status === "terminated";
    const isWarning = summary?.integrity_score >= 50 && summary?.integrity_score < 80;

    const getEventIcon = (type: string) => {
        switch (type) {
            case "TAB_SWITCH": return <MonitorOff className="h-5 w-5 text-amber-500" />;
            case "WINDOW_BLUR": return <EyeOff className="h-5 w-5 text-amber-500" />;
            case "COPY_ATTEMPT":
            case "PASTE_ATTEMPT": return <Copy className="h-5 w-5 text-red-500" />;
            case "RIGHT_CLICK": return <MousePointer2 className="h-5 w-5 text-amber-500" />;
            case "DEVTOOLS_OPEN": return <TerminalSquare className="h-5 w-5 text-red-600" />;
            case "AUTO_TERMINATED": return <ShieldAlert className="h-5 w-5 text-red-600" />;
            default: return <Activity className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Session Timeline</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {sessionId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8">Event Stream</h2>

                        {events.length === 0 ? (
                            <div className="text-center py-12">
                                <ShieldCheck className="h-16 w-16 text-emerald-100 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-700">Clean Session</p>
                                <p className="text-gray-500 mt-1">No violations have been logged.</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                                {events.map((event: any) => (
                                    <div key={event.id} className="relative pl-8">
                                        <div className="absolute -left-[17px] top-1 h-8 w-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center">
                                            {getEventIcon(event.event_type)}
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-black text-gray-900">{event.event_type.replace(/_/g, " ")}</h4>
                                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                <pre className="mt-3 bg-gray-900 text-gray-300 p-3 rounded-xl text-xs overflow-x-auto">
                                                    {JSON.stringify(event.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Session Summary Card */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-6">Integrity Status</h2>

                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                            <div className={`text-5xl font-black mb-2 flex items-center gap-3
                                ${isHighRisk ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {summary?.integrity_score}%
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Calculated Score</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-500">Status</span>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                                    ${summary?.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600' :
                                        summary?.status === 'terminated' ? 'bg-red-50 text-red-600' :
                                            'bg-gray-100 text-gray-600'}`}>
                                    {summary?.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-500">Total Violations</span>
                                <span className="font-black text-gray-900">{summary?.violations}</span>
                            </div>
                            {incident?.status === 'false_positive' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-500">Incident Cleared</span>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {summary?.status !== "terminated" && incident?.status !== "false_positive" && (
                            <div className="space-y-3 pt-6 border-t border-gray-100">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Admin Notes (Optional)"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full text-sm py-2 px-3 border border-gray-200 rounded-xl mb-3"
                                    />
                                    <button
                                        onClick={() => clearIncidentMutation.mutate()}
                                        disabled={clearIncidentMutation.isPending}
                                        className="w-full flex justify-center py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-100 transition-all"
                                    >
                                        Mark as False Positive
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowTerminateModal(true)}
                                    className="w-full flex justify-center items-center gap-2 py-3 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-md"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    Terminate Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Terminate Modal */}
            {showTerminateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-100">
                        <div className="text-center mb-6">
                            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
                            <h3 className="text-xl font-black text-gray-900">Force Terminate?</h3>
                            <p className="text-sm text-gray-500 mt-1">This will immediately block the student from continuing. This action cannot be undone.</p>
                        </div>

                        <input
                            type="text"
                            placeholder="Reason for termination..."
                            value={terminateReason}
                            onChange={(e) => setTerminateReason(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl mb-6 text-sm"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTerminateModal(false)}
                                className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => terminateMutation.mutate()}
                                disabled={terminateMutation.isPending || !terminateReason}
                                className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {terminateMutation.isPending ? "Terminating..." : "Terminate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
