import { useState, useEffect, useRef } from "react";
import { examQuestions } from "../../data/mockData";
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag, CheckCircle, Send, X } from "lucide-react";
import { useNavigate } from "react-router";

type QuestionStatus = "not_visited" | "answered" | "marked" | "not_answered";

export default function ExamEngine() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleAutoSubmit = () => {
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const sections = Array.from(new Set(examQuestions.map((q: any) => q.section)));

  useEffect(() => {
    if (started && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, submitted]);

  // Tab switch detection
  useEffect(() => {
    if (!started || submitted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings(w => {
          const newCount = w + 1;
          setShowTabWarning(true);
          setTimeout(() => setShowTabWarning(false), 4000);
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [started, submitted]);

  const handleSelect = (optionIdx: number) => {
    setAnswers({ ...answers, [currentQ]: optionIdx });
    setVisited(v => new Set([...v, currentQ]));
  };

  const handleMark = () => {
    setMarked(m => {
      const newSet = new Set(m);
      if (newSet.has(currentQ)) newSet.delete(currentQ);
      else newSet.add(currentQ);
      return newSet;
    });
  };

  const handleNext = () => {
    setVisited(v => new Set([...v, currentQ]));
    if (currentQ < examQuestions.length - 1) setCurrentQ(currentQ + 1);
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const getStatus = (idx: number): QuestionStatus => {
    if (answers[idx] !== undefined) return marked.has(idx) ? "marked" : "answered";
    if (visited.has(idx)) return "not_answered";
    return "not_visited";
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const calculateScore = () => {
    let score = 0;
    examQuestions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct) score += q.marks;
      else if (answers[i] !== undefined) score -= q.negativeMarks;
    });
    return Math.max(0, Math.round(score));
  };

  const totalMarks = examQuestions.reduce((a: number, q: any) => a + q.marks, 0);

  // Pre-exam screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-gray-900 text-xl mb-2" style={{ fontWeight: 700 }}>Campus Drive 2025 — Aptitude Round</h2>
          <p className="text-gray-500 text-sm mb-6">Please read the instructions carefully before starting.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Duration", value: "90 Minutes" },
              { label: "Total Questions", value: `${examQuestions.length} Questions` },
              { label: "Total Marks", value: `${totalMarks} Marks` },
              { label: "Negative Marking", value: "0.5 per wrong" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-xs">{s.label}</p>
                <p className="text-gray-800 text-sm mt-0.5" style={{ fontWeight: 600 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-6">
            <h4 className="text-amber-800 text-sm mb-2" style={{ fontWeight: 600 }}>⚠️ Important Instructions</h4>
            <ul className="text-amber-700 text-xs space-y-1.5 list-disc list-inside">
              <li>Do not switch tabs or minimize the window — violations are tracked</li>
              <li>Exam auto-submits when time runs out</li>
              <li>Use "Mark for Review" to revisit questions later</li>
              <li>Ensure stable internet connection before starting</li>
              <li>You have 1 attempt only — this cannot be reversed</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/student")} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => { setStarted(true); setVisited(new Set([0])); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 transition-colors" style={{ fontWeight: 600 }}>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submitted screen
  if (submitted) {
    const score = calculateScore();
    const percentage = Math.round((score / totalMarks) * 100);
    const passed = percentage >= 60;
    const answered = Object.keys(answers).length;

    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? "bg-emerald-50" : "bg-red-50"}`}>
            {passed
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <X className="w-10 h-10 text-red-500" />
            }
          </div>
          <h2 className="text-gray-900 text-2xl" style={{ fontWeight: 700 }}>
            {passed ? "Congratulations!" : "Better Luck Next Time"}
          </h2>
          <p className={`text-sm mt-1 ${passed ? "text-emerald-600" : "text-red-500"}`} style={{ fontWeight: 600 }}>
            {passed ? "You PASSED the exam!" : "You did not meet the cutoff"}
          </p>

          <div className="mt-6 bg-gray-50 rounded-2xl p-6">
            <div className={`text-5xl ${passed ? "text-emerald-600" : "text-red-500"}`} style={{ fontWeight: 800 }}>{percentage}%</div>
            <div className="text-gray-500 text-sm mt-1">{score} / {totalMarks} marks</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="text-center">
              <div className="text-emerald-600 text-xl" style={{ fontWeight: 700 }}>{Object.values(answers).filter((a, i) => a === examQuestions[i]?.correct).length}</div>
              <div className="text-gray-500 text-xs">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 text-xl" style={{ fontWeight: 700 }}>{answered - Object.values(answers).filter((a, i) => a === examQuestions[i]?.correct).length}</div>
              <div className="text-gray-500 text-xs">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 text-xl" style={{ fontWeight: 700 }}>{examQuestions.length - answered}</div>
              <div className="text-gray-500 text-xs">Unattempted</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate("/student/results")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 transition-colors text-sm" style={{ fontWeight: 600 }}>
              View Detailed Results
            </button>
            <button onClick={() => navigate("/student")} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 hover:bg-gray-50 text-sm">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = examQuestions[currentQ];

  return (
    <div className="flex gap-6 min-h-full">
      {/* Tab Warning */}
      {showTabWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Tab switch detected! Warning {tabWarnings} of 3
        </div>
      )}

      {/* Main Exam Area */}
      <div className="flex-1 space-y-4">
        {/* Exam Header */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>Campus Drive 2025 — Aptitude Round</p>
            <p className="text-gray-400 text-xs">{q.section} · Question {currentQ + 1} of {examQuestions.length}</p>
          </div>
          <div className="flex items-center gap-3">
            {tabWarnings > 0 && (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5" /> {tabWarnings} Warning{tabWarnings > 1 ? "s" : ""}
              </div>
            )}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${timeLeft < 600 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`} style={{ fontWeight: 700 }}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>Q{currentQ + 1}</span>
            <span className="text-gray-500 text-xs">{q.marks} mark{q.marks > 1 ? "s" : ""} · -{q.negativeMarks} negative</span>
          </div>
          <p className="text-gray-800 text-base mb-6" style={{ lineHeight: 1.6 }}>{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${answers[currentQ] === i
                    ? "border-blue-400 bg-blue-50 text-blue-800"
                    : "border-gray-100 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
              >
                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs mr-3 flex-shrink-0 ${answers[currentQ] === i ? "bg-blue-500 text-white" : "bg-white border border-gray-200 text-gray-500"
                  }`} style={{ fontWeight: 600 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQ === 0}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${marked.has(currentQ) ? "bg-orange-50 border-orange-200 text-orange-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Flag className="w-3.5 h-3.5" /> {marked.has(currentQ) ? "Unmark" : "Mark for Review"}
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
          <button
            onClick={handleNext}
            disabled={currentQ === examQuestions.length - 1}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Panel */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Summary */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-gray-700 text-xs mb-3" style={{ fontWeight: 600 }}>Question Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Answered", count: Object.keys(answers).length, color: "bg-emerald-500" },
              { label: "Marked", count: marked.size, color: "bg-orange-400" },
              { label: "Not Visited", count: examQuestions.length - visited.size, color: "bg-gray-200" },
              { label: "Not Answered", count: visited.size - Object.keys(answers).length, color: "bg-red-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm ${s.color}`} />
                <span className="text-gray-600">{s.label}: <span style={{ fontWeight: 600 }}>{s.count}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Navigation */}
        {sections.map((section: any) => {
          const sectionQs = examQuestions.filter((q: any) => q.section === section);
          const startIdx = examQuestions.findIndex((q: any) => q.section === section);
          return (
            <div key={section as string} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h3 className="text-gray-600 text-xs mb-3" style={{ fontWeight: 600 }}>{section as string}</h3>
              <div className="flex flex-wrap gap-1.5">
                {sectionQs.map((_: any, i: number) => {
                  const idx = startIdx + i;
                  const status = getStatus(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => { setCurrentQ(idx); setVisited(v => new Set([...v, idx])); }}
                      className={`w-8 h-8 rounded-lg text-xs transition-all ${idx === currentQ ? "ring-2 ring-blue-500 ring-offset-1" : ""
                        } ${status === "answered" ? "bg-emerald-500 text-white" :
                          status === "marked" ? "bg-orange-400 text-white" :
                            status === "not_answered" ? "bg-red-400 text-white" :
                              "bg-gray-100 text-gray-600"
                        }`}
                      style={{ fontWeight: 600 }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-gray-900 text-base" style={{ fontWeight: 700 }}>Submit Exam?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Answered:</span>
                <span className="text-emerald-600" style={{ fontWeight: 600 }}>{Object.keys(answers).length}/{examQuestions.length}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Marked for Review:</span>
                <span className="text-orange-500" style={{ fontWeight: 600 }}>{marked.size}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Unattempted:</span>
                <span className="text-red-500" style={{ fontWeight: 600 }}>{examQuestions.length - Object.keys(answers).length}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Continue Exam</button>
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitted(true); if (timerRef.current) clearInterval(timerRef.current); }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}