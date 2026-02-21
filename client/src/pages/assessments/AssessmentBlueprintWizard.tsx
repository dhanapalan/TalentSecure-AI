// =============================================================================
// TalentSecure AI — Assessment Blueprint Wizard (v2)
// =============================================================================
// A modern, interactive wizard for hiring managers to allocate exam focus across
// 5 categories using constrained range sliders, then generate assessments via
// the question_bank (curator) or OpenAI GPT-4o (dynamic generator).
// =============================================================================

import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import api from "../../lib/api";
import { CheckCircle2, School, Plus, ShieldCheck, ChevronRight } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "Reasoning", icon: "🧠", gradient: "from-blue-500   to-blue-600", bar: "bg-blue-500", ring: "ring-blue-400", badge: "bg-blue-50   text-blue-700" },
  { key: "Maths", icon: "📐", gradient: "from-emerald-500 to-emerald-600", bar: "bg-emerald-500", ring: "ring-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  { key: "Aptitude", icon: "💡", gradient: "from-amber-500  to-amber-600", bar: "bg-amber-500", ring: "ring-amber-400", badge: "bg-amber-50  text-amber-700" },
  { key: "Data Structures", icon: "🌳", gradient: "from-purple-500 to-purple-600", bar: "bg-purple-500", ring: "ring-purple-400", badge: "bg-purple-50 text-purple-700" },
  { key: "Programming", icon: "💻", gradient: "from-rose-500   to-rose-600", bar: "bg-rose-500", ring: "ring-rose-400", badge: "bg-rose-50   text-rose-700" },
] as const;

type GenerationMode = "curator" | "dynamic";

// ── Types ────────────────────────────────────────────────────────────────────

interface SliderState {
  [category: string]: number; // 0–100
}

interface GeneratedQuestion {
  type: "mcq" | "coding" | "multiple_choice" | "coding_challenge";
  category: string;
  difficulty?: string;
  difficulty_level?: string;
  question_text: string;
  options?: string[] | unknown[];
  correct_answer?: number | string;
  hidden_test_cases?: { input: string; expected_output: string }[];
  test_cases?: { input: string; expectedOutput: string }[];
  [key: string]: unknown;
}

interface CuratorResponse {
  totalRequested: number;
  totalCurated: number;
  breakdown: { category: string; requested: number; fulfilled: number; available: number }[];
  questions: GeneratedQuestion[];
  exam: { id: string };
}

interface DynamicResponse {
  total_questions: number;
  category_breakdown: { category: string; count: number; percentage: number }[];
  questions: GeneratedQuestion[];
  exam: { id: string };
}

interface Campus {
  id: string;
  name: string;
  city: string;
  tier: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initialSliders(): SliderState {
  return Object.fromEntries(CATEGORIES.map((c) => [c.key, 20]));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AssessmentBlueprintWizard() {
  // ── State ────────────────────────────────────────────────────────────────
  const [sliders, setSliders] = useState<SliderState>(initialSliders);
  const [totalQuestions, setTotalQuestions] = useState(45);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [mode, setMode] = useState<GenerationMode>("curator");
  const [results, setResults] = useState<GeneratedQuestion[] | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // ── Queries ──
  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return data.data as Campus[];
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────
  const total = useMemo(
    () => Object.values(sliders).reduce((s, v) => s + v, 0),
    [sliders],
  );
  const remaining = 100 - total;
  const isValid = Math.abs(total - 100) < 0.5;

  // ── Slider change handler (constrained to not exceed 100%) ───────────────
  const handleSlider = useCallback(
    (category: string, raw: number) => {
      setSliders((prev) => {
        const others = total - prev[category];
        const maxAllowed = 100 - others;
        const clamped = Math.min(raw, maxAllowed);
        return { ...prev, [category]: clamped };
      });
    },
    [total],
  );

  // ── Auto-balance remaining across zero-value sliders ─────────────────────
  const autoBalance = useCallback(() => {
    setSliders(() => {
      const perCategory = Math.floor(100 / CATEGORIES.length);
      const leftover = 100 - perCategory * CATEGORIES.length;
      const result: SliderState = {};
      CATEGORIES.forEach((c, i) => {
        result[c.key] = perCategory + (i < leftover ? 1 : 0);
      });
      return result;
    });
  }, []);

  const resetSliders = useCallback(() => setSliders(initialSliders()), []);

  // ── API mutations ────────────────────────────────────────────────────────
  const curatorMutation = useMutation({
    mutationFn: async () => {
      const weights: Record<string, number> = {};
      for (const [cat, pct] of Object.entries(sliders)) {
        if (pct > 0) weights[cat] = pct;
      }
      const { data } = await api.post<{ success: boolean; data: CuratorResponse }>(
        "/exams/blueprint-curator",
        { weights, total_questions: totalQuestions, duration_minutes: durationMinutes },
      );
      return data.data;
    },
    onSuccess: (data) => {
      setResults(data.questions);
      setExamId(data.exam.id);
      toast.success(`Curated ${data.totalCurated} questions from the bank`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to curate questions");
    },
  });

  const dynamicMutation = useMutation({
    mutationFn: async () => {
      const weights: Record<string, number> = {};
      for (const [cat, pct] of Object.entries(sliders)) {
        if (pct > 0) weights[cat] = pct;
      }
      const { data } = await api.post<{ success: boolean; data: DynamicResponse }>(
        "/exams/generate-dynamic",
        { weights, total_questions: totalQuestions, duration_minutes: durationMinutes },
      );
      return data.data;
    },
    onSuccess: (data) => {
      setResults(data.questions);
      setExamId(data.exam.id);
      toast.success(`Generated ${data.total_questions} original questions via AI`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to generate questions");
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/exams/${examId}/assign`, { campus_ids: selectedCampuses });
    },
    onSuccess: () => {
      toast.success("Assessment assigned to colleges!");
      setResults(null);
      setExamId(null);
      setSelectedCampuses([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to assign assessment");
    },
  });

  const isLoading = curatorMutation.isPending || dynamicMutation.isPending;

  const handleGenerate = () => {
    if (!isValid) {
      toast.error("Category percentages must sum to exactly 100%");
      return;
    }
    setResults(null);
    setExamId(null);
    setExpandedIdx(null);
    if (mode === "curator") {
      curatorMutation.mutate();
    } else {
      dynamicMutation.mutate();
    }
  };

  const toggleCampus = (id: string) => {
    setSelectedCampuses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Assessment Blueprint Wizard
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            AI-powered exam strategy for precision hiring.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-indigo-700 shadow-sm border border-indigo-100">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Proctoring Enabled</span>
        </div>
      </div>

      {/* ── Main Card ─────────────────────────────────────────────── */}
      <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1.5 flex transition-all duration-500">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className={clsx("h-full transition-all duration-500", c.bar)}
              style={{ width: `${sliders[c.key]}%` }}
            />
          ))}
          {remaining > 0 && <div className="h-full bg-gray-100" style={{ width: `${remaining}%` }} />}
        </div>

        <div className="p-8 sm:p-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Strategic Allocation</h2>
              <p className="text-sm text-gray-500 max-w-sm">Distribute the exam's focus across core technical and cognitive domains.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={clsx(
                "rounded-2xl px-6 py-3 transition-all",
                isValid ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-2 ring-rose-100"
              )}>
                <span className="text-2xl font-black">{total}%</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-widest opacity-70">TotalFocus</span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={autoBalance} className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">AutoBalance</button>
                <button onClick={resetSliders} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Reset</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-8">
              {CATEGORIES.map((cat) => {
                const value = sliders[cat.key];
                const others = total - value;
                const max = 100 - others;
                return (
                  <div key={cat.key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx("p-2 rounded-xl text-white shadow-md", cat.gradient)}>
                          <span className="text-lg">{cat.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">{cat.key}</p>
                          <p className="text-[10px] font-medium text-gray-400">Target Weighting</p>
                        </div>
                      </div>
                      <div className="flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleSlider(cat.key, parseInt(e.target.value) || 0)}
                          className="w-10 bg-transparent text-right font-black text-indigo-600 focus:outline-none"
                        />
                        <span className="ml-1 text-[10px] font-bold text-gray-400">%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={max}
                        value={value}
                        onChange={(e) => handleSlider(cat.key, parseInt(e.target.value))}
                        className="slider-thumb h-2 w-full appearance-none rounded-full bg-gray-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl bg-gray-50 p-8 flex flex-col justify-between border border-gray-100">
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-gray-900 border-l-4 border-indigo-600 pl-4">Delivery Parameters</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">QuestionCount</label>
                    <input
                      type="number"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-xl font-black text-gray-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">TimeLimit (min)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-xl font-black text-gray-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Intelligence Engine</label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-white rounded-2xl border border-gray-200">
                    <button
                      onClick={() => setMode("curator")}
                      className={clsx(
                        "rounded-xl py-3 text-sm font-bold transition-all",
                        mode === "curator" ? "bg-gray-900 text-white shadow-xl" : "text-gray-400 hover:text-gray-600"
                      )}
                    >📚 Curator</button>
                    <button
                      onClick={() => setMode("dynamic")}
                      className={clsx(
                        "rounded-xl py-3 text-sm font-bold transition-all",
                        mode === "dynamic" ? "bg-indigo-600 text-white shadow-xl" : "text-gray-400 hover:text-gray-600"
                      )}
                    >🤖 GPT-4o</button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!isValid || isLoading}
                className={clsx(
                  "mt-10 w-full rounded-2xl py-5 text-lg font-black tracking-tight text-white shadow-2xl transition-all active:scale-95 group overflow-hidden",
                  isValid && !isLoading ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" : "bg-gray-200 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Initializing AI...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="h-6 w-6" /> Generate Blueprint
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results & Assignment ──────────────────────────────────── */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 italic">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" /> Assessment Preview
            </h3>
            <div className="space-y-4">
              {results.slice(0, expandedIdx === null ? 5 : 20).map((q, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-default group">
                  <div className="flex items-start justify-between">
                    <span className="h-6 w-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{i + 1}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">{q.category}</span>
                  </div>
                  <p className="mt-4 text-gray-700 font-medium leading-relaxed">{q.question_text}</p>
                </div>
              ))}
              {results.length > 5 && expandedIdx === null && (
                <button onClick={() => setExpandedIdx(1)} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:bg-gray-50 transition-colors">
                  View {results.length - 5} more questions...
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 italic">
              <School className="h-7 w-7 text-indigo-600" /> Target Campuses
            </h3>
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-8 space-y-8">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">Select one or more colleges to assign this generated assessment to.</p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {campuses?.map(campus => (
                  <button
                    key={campus.id}
                    onClick={() => toggleCampus(campus.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2",
                      selectedCampuses.includes(campus.id)
                        ? "bg-white border-indigo-600 shadow-lg text-indigo-700 ring-4 ring-indigo-50 scale-[1.02]"
                        : "bg-white/50 border-white hover:border-gray-200 text-gray-400"
                    )}
                  >
                    <div className="text-left">
                      <p className="text-sm font-black">{campus.name}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-60">{campus.city} • {campus.tier}</p>
                    </div>
                    {selectedCampuses.includes(campus.id) && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                  </button>
                ))}
              </div>

              <button
                onClick={() => assignMutation.mutate()}
                disabled={selectedCampuses.length === 0 || assignMutation.isPending}
                className={clsx(
                  "w-full rounded-2xl py-4 font-black flex items-center justify-center gap-3 shadow-xl transition-all",
                  selectedCampuses.length > 0 && !assignMutation.isPending
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                {assignMutation.isPending ? "Assigning..." : (
                  <>Assign to {selectedCampuses.length} Campus{selectedCampuses.length !== 1 && 'es'}<ChevronRight className="h-5 w-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom styles ─────────────────────────────────────────── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
        input[type="range"].slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        input[type="range"].slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: #ffffff;
          border: 4px solid #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        input[type="range"].slider-thumb::-webkit-slider-thumb:hover { transform: scale(1.2); }
      `}</style>
    </div>
  );
}
