import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Clock,
    Flag,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    Eraser,
    Gamepad2,
} from "lucide-react";

// ── Mock Questions ──────────────────────────────────────────────────────────

const MOCK_QUESTIONS = [
    {
        id: "mock-q-1",
        category: "Quantitative Aptitude",
        type: "MCQ",
        difficulty_level: "medium",
        question_text: "A train 150m long is running at a speed of 54 km/hr. How much time will it take to cross a platform 250m long?",
        options: [
            { label: "A", text: "20 seconds" },
            { label: "B", text: "25 seconds" },
            { label: "C", text: "26.67 seconds" },
            { label: "D", text: "30 seconds" }
        ],
        marks: 5,
    },
    {
        id: "mock-q-2",
        category: "Logical Reasoning",
        type: "MCQ",
        difficulty_level: "easy",
        question_text: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
        options: [
            { label: "A", text: "His own" },
            { label: "B", text: "His son's" },
            { label: "C", text: "His father's" },
            { label: "D", text: "His nephew's" }
        ],
        marks: 2,
    },
    {
        id: "mock-q-3",
        category: "Verbal Ability",
        type: "MCQ",
        difficulty_level: "medium",
        question_text: "Choose the word most nearly opposite in meaning to: 'FRUGAL'",
        options: [
            { label: "A", text: "Parsimonious" },
            { label: "B", text: "Extravagant" },
            { label: "C", text: "Prudent" },
            { label: "D", text: "Miserly" }
        ],
        marks: 3,
    }
];

// ── Component ────────────────────────────────────────────────────────────────

export default function MockExamPlayer() {
    const navigate = useNavigate();

    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { selected: string[]; flagged?: boolean }>>({});
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
    const [submitted, setSubmitted] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Timer
    useEffect(() => {
        if (submitted || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setSubmitted(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const handleSelectOption = (qId: string, label: string) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: { ...(prev[qId] || {}), selected: [label] }
        }));
    };

    const handleToggleFlag = (qId: string) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: { ...(prev[qId] || { selected: [] }), flagged: !prev[qId]?.flagged }
        }));
    };

    const currentQuestion = MOCK_QUESTIONS[currentIndex];
    const answeredCount = MOCK_QUESTIONS.filter(q => answers[q.id]?.selected?.length > 0).length;
    const unansweredCount = MOCK_QUESTIONS.length - answeredCount;

    if (submitted) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-500">
                    <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Practice Complete!</h1>
                    <p className="text-slate-500 font-medium mb-8">Great job on finishing this mock session.</p>

                    <div className="bg-indigo-50 rounded-3xl p-6 mb-8 border border-indigo-100">
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Performance Summary</p>
                        <p className="text-4xl font-black text-indigo-600">
                            {answeredCount} <span className="text-lg text-indigo-400">/ {MOCK_QUESTIONS.length}</span>
                        </p>
                        <p className="text-[10px] font-bold text-indigo-400 mt-1 italic">Questions Attempted</p>
                    </div>

                    <button
                        onClick={() => navigate("/app/student-portal")}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20"
                    >
                        Return to Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-[300px] bg-slate-50 border-r border-slate-100 flex flex-col z-10 transition-all">
                <div className="p-6 border-b border-slate-200/50 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Gamepad2 className="h-4 w-4" />
                        </div>
                        <h2 className="font-black text-slate-900 text-sm tracking-tight text-wrap">Mock Session</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100">Practice Mode</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-4 gap-3">
                        {MOCK_QUESTIONS.map((q, i) => {
                            const isAnswered = answers[q.id]?.selected?.length > 0;
                            const isFlagged = answers[q.id]?.flagged;
                            const isCurrent = i === currentIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`h-12 w-12 rounded-2xl text-xs font-black transition-all relative flex items-center justify-center border-2 ${isCurrent ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" :
                                        isAnswered ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            isFlagged ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                        }`}
                                >
                                    {i + 1}
                                    {isFlagged && <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 space-y-4 bg-white/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Attempted</span>
                        <span className="text-xs font-black text-emerald-600">{answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Remaining</span>
                        <span className="text-xs font-black text-slate-900">{unansweredCount}</span>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
                {/* Header */}
                <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</span>
                            <span className="text-xl font-black text-slate-900">{currentIndex + 1} <span className="text-slate-300 font-medium">/ {MOCK_QUESTIONS.length}</span></span>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</span>
                            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{currentQuestion.difficulty_level}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm border-2 ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-slate-50 text-slate-700 border-slate-100"}`}>
                            <Clock className="h-4 w-4" />
                            {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            Finish Mock
                        </button>
                    </div>
                </div>

                {/* Question */}
                <div className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="mb-6">
                                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                    {currentQuestion.category}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 leading-relaxed">
                                {currentQuestion.question_text}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => handleSelectOption(currentQuestion.id, opt.label)}
                                    className={`group w-full flex items-center gap-5 p-6 rounded-3xl border-2 transition-all text-left ${answers[currentQuestion.id]?.selected[0] === opt.label
                                        ? "border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-500/5"
                                        : "border-white bg-white hover:border-slate-100 hover:bg-slate-50 shadow-sm"
                                        }`}
                                >
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${answers[currentQuestion.id]?.selected[0] === opt.label
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                        }`}>
                                        {opt.label}
                                    </div>
                                    <span className={`text-lg font-medium ${answers[currentQuestion.id]?.selected[0] === opt.label ? "text-slate-900" : "text-slate-600"}`}>
                                        {opt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="h-24 bg-white border-t border-slate-100 flex items-center justify-center px-10 shrink-0">
                    <div className="max-w-3xl w-full flex items-center justify-between">
                        <button
                            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="h-5 w-5" /> Previous
                        </button>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleToggleFlag(currentQuestion.id)}
                                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all border-2 ${answers[currentQuestion.id]?.flagged
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                                    }`}
                            >
                                <Flag className={`h-4 w-4 ${answers[currentQuestion.id]?.flagged ? "fill-amber-600" : ""}`} />
                                Review Later
                            </button>
                            <button
                                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: { selected: [], flagged: prev[currentQuestion.id]?.flagged } }))}
                                className="px-6 py-4 rounded-2xl font-black text-sm bg-white text-slate-400 border-2 border-slate-100 hover:bg-slate-50 hover:text-red-500 transition-all"
                            >
                                <Eraser className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setCurrentIndex(i => Math.min(MOCK_QUESTIONS.length - 1, i + 1))}
                            disabled={currentIndex === MOCK_QUESTIONS.length - 1}
                            className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-sm bg-slate-900 text-white hover:bg-indigo-600 shadow-xl shadow-slate-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 text-center">
                        <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Finish Practice?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-8">You've attempted {answeredCount} out of {MOCK_QUESTIONS.length} questions.</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Keep Going
                            </button>
                            <button
                                onClick={() => setSubmitted(true)}
                                className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Yes, Finish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
