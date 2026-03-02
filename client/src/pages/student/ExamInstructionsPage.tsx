import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../lib/api";
import {
    Clock,
    FileText,
    AlertTriangle,
    CheckCircle2,
    ArrowLeft,
    Play,
    RotateCcw,
    ShieldCheck,
} from "lucide-react";

export default function ExamInstructionsPage() {
    const { driveId } = useParams<{ driveId: string }>();
    const navigate = useNavigate();

    const { data: session, isLoading } = useQuery({
        queryKey: ["exam-session", driveId],
        queryFn: async () => {
            // Try to get existing session info from drives list
            const { data } = await api.get("/exam-sessions/my-drives");
            return data.data?.find((d: any) => d.drive_id === driveId) || null;
        },
        enabled: !!driveId,
    });

    const startMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/exam-sessions/${driveId}/start`);
            return data.data;
        },
        onSuccess: () => {
            navigate(`/app/student-portal/exam/${driveId}/play`);
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <AlertTriangle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-900">Exam Not Found</h2>
                <p className="text-gray-500 mt-2">You are not assigned to this drive.</p>
                <Link to="/app/student-portal" className="mt-6 inline-block text-indigo-600 font-bold hover:underline">
                    ← Back to Portal
                </Link>
            </div>
        );
    }

    const isResume = session.session_status === "in_progress";
    const isCompleted = session.session_status === "completed";

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Back Link */}
            <Link to="/app/student-portal" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Student Portal
            </Link>

            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gray-900 p-10 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{session.drive_name}</h1>
                            <p className="text-gray-400 font-medium mt-1">{session.rule_name}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                            </div>
                            <p className="text-2xl font-black">{session.duration_minutes} min</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <FileText className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Questions</span>
                            </div>
                            <p className="text-2xl font-black">{session.total_questions}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-amber-400 mb-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Marks</span>
                            </div>
                            <p className="text-2xl font-black">{session.total_marks}</p>
                        </div>
                    </div>
                </div>

                {/* Instructions Body */}
                <div className="p-10">
                    {isCompleted ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Exam Completed</h2>
                            <p className="text-gray-500">
                                Your score: <span className="font-black text-indigo-600">{session.score ?? "—"}</span> / {session.total_marks}
                            </p>
                            <Link to="/app/student-portal" className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-black transition-all">
                                <ArrowLeft className="h-4 w-4" /> Back to Portal
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-black text-gray-900 mb-6">Exam Instructions</h2>

                            <div className="space-y-4 mb-8">
                                {[
                                    "This is a timed examination. The timer starts when you click 'Start Exam'.",
                                    `You have ${session.duration_minutes} minutes to complete ${session.total_questions} questions.`,
                                    "You can navigate freely between questions using the question panel.",
                                    "You can flag questions for review and revisit them later.",
                                    session.negative_marking_enabled
                                        ? `Negative marking is enabled (−${session.negative_marking_value} per wrong answer).`
                                        : "There is no negative marking in this exam.",
                                    `Minimum cutoff to pass: ${session.overall_cutoff}%`,
                                    "Your answers are auto-saved every few seconds.",
                                    "If you lose connection, you can resume within the remaining time.",
                                    "The exam will auto-submit when the timer reaches zero.",
                                ].map((instruction, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{instruction}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Warning */}
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-8">
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm font-bold text-amber-800">
                                    Once started, the exam timer cannot be paused. Make sure you are ready.
                                </p>
                            </div>

                            {/* Agreement & Start */}
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-8">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <p className="text-sm font-bold text-emerald-800">
                                    By proceeding, I confirm that I will take this exam honestly and follow all instructions.
                                </p>
                            </div>

                            <button
                                onClick={() => startMutation.mutate()}
                                disabled={startMutation.isPending}
                                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4.5 text-sm font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {startMutation.isPending ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : isResume ? (
                                    <>
                                        <RotateCcw className="h-5 w-5" />
                                        Resume Exam
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-5 w-5" />
                                        I Agree &amp; Start Exam
                                    </>
                                )}
                            </button>

                            {startMutation.isError && (
                                <p className="text-red-600 text-sm font-bold mt-4 text-center">
                                    {(startMutation.error as any)?.response?.data?.error || "Failed to start exam. Please try again."}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
