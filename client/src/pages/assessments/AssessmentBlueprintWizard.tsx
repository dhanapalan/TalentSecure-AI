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
import { CheckCircle2, Plus, ShieldCheck, ChevronRight, X, Library } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "Reasoning", icon: "🧠", gradient: "from-blue-500   to-blue-600", bar: "bg-blue-500", ring: "ring-blue-400", badge: "bg-blue-50   text-blue-700" },
  { key: "Aptitude", icon: "💡", gradient: "from-amber-500  to-amber-600", bar: "bg-amber-500", ring: "ring-amber-400", badge: "bg-amber-50  text-amber-700" },
  { key: "Coding / Programming", icon: "💻", gradient: "from-emerald-500 to-emerald-600", bar: "bg-emerald-500", ring: "ring-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  { key: "SQL & Databases", icon: "🗄️", gradient: "from-cyan-500 to-cyan-600", bar: "bg-cyan-500", ring: "ring-cyan-400", badge: "bg-cyan-50 text-cyan-700" },
  { key: "Core CS (DS/Algo)", icon: "🌳", gradient: "from-purple-500 to-purple-600", bar: "bg-purple-500", ring: "ring-purple-400", badge: "bg-purple-50 text-purple-700" },
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
  exam: { id: string };
  blueprint: {
    totalRequested: number;
    totalCurated: number;
    breakdown: { category: string; requested: number; fulfilled: number; available: number }[];
    questions: GeneratedQuestion[];
  };
}

interface DynamicResponse {
  exam: { id: string };
  assessment: {
    total_questions: number;
    category_breakdown: { category: string; count: number; percentage: number }[];
    questions: GeneratedQuestion[];
  };
}

interface Campus {
  id: string;
  name: string;
  city: string;
  tier: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initialSliders(): SliderState {
  const cats = CATEGORIES.map((c) => c.key);
  const base = Math.floor(100 / cats.length);          // 16 each for 6 cats
  const remainder = 100 - base * cats.length;           // 4 leftover
  return Object.fromEntries(
    cats.map((key, i) => [key, base + (i < remainder ? 1 : 0)]),
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AssessmentBlueprintWizard() {
  // ── State ────────────────────────────────────────────────────────────────
  const [sliders, setSliders] = useState<SliderState>(initialSliders);
  const [totalQuestions, setTotalQuestions] = useState(45);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [mode, setMode] = useState<GenerationMode>("curator");
  const [questionsPerStudent, setQuestionsPerStudent] = useState(15);
  const [results, setResults] = useState<GeneratedQuestion[] | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // ── Queries ──
  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return data.data as Campus[];
    },
  });

  const { data: qbQuestions } = useQuery({
    queryKey: ["qb-questions"],
    queryFn: async () => {
      const { data } = await api.get("/questions");
      return data.data as any[];
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────
  const total = useMemo(
    () => Object.values(sliders).reduce((s, v) => s + v, 0),
    [sliders],
  );
  const isValid = Math.abs(total - 100) < 0.5;

  // ── Slider change handler (Maintains 100% total by adjusting others) ──────
  const handleSlider = useCallback(
    (category: string, newValue: number) => {
      setSliders((prev) => {
        const oldValue = prev[category];
        const diff = newValue - oldValue;
        if (diff === 0) return prev;

        const otherCats = CATEGORIES.map((c) => c.key).filter((k) => k !== category);
        const nextSliders = { ...prev, [category]: newValue };

        // We need to distribute -diff among otherCats
        const toDistribute = -diff;
        const othersTotal = otherCats.reduce((sum, k) => sum + prev[k], 0);

        if (toDistribute < 0) {
          // We are increasing the current slider, must decrease others
          if (othersTotal === 0) return prev; // Cannot increase if others are all 0
          otherCats.forEach((k) => {
            const weight = prev[k] / othersTotal;
            nextSliders[k] = Math.max(0, prev[k] + toDistribute * weight);
          });
        } else {
          // We are decreasing the current slider, increase others proportionally
          if (othersTotal === 0) {
            const perOther = toDistribute / otherCats.length;
            otherCats.forEach((k) => (nextSliders[k] = perOther));
          } else {
            otherCats.forEach((k) => {
              const weight = prev[k] / othersTotal;
              nextSliders[k] = Math.min(100, prev[k] + toDistribute * weight);
            });
          }
        }

        // Final normalization to ensure sum is exactly 100 (handling float rounding)
        const currentSum = Object.values(nextSliders).reduce((s, v) => s + v, 0);
        const error = 100 - currentSum;
        if (Math.abs(error) > 0.01) {
          const firstOther = otherCats[0];
          nextSliders[firstOther] = Math.max(0, nextSliders[firstOther] + error);
        }

        // Round to integers for cleaner UX
        const rounded: SliderState = {};
        Object.entries(nextSliders).forEach(([k, v]) => {
          rounded[k] = Math.round(v);
        });

        // Ensure rounded sum is still exactly 100
        const roundedSum = Object.values(rounded).reduce((s, v) => s + v, 0);
        if (roundedSum !== 100) {
          const diff2 = 100 - roundedSum;
          const largest = otherCats.sort((a, b) => rounded[b] - rounded[a])[0];
          rounded[largest] += diff2;
        }

        return rounded;
      });
    },
    [setSliders],
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
        {
          weights,
          total_questions: totalQuestions,
          questions_per_student: questionsPerStudent,
          duration_minutes: durationMinutes
        },
      );
      return data.data;
    },
    onSuccess: (data) => {
      setResults(data.blueprint.questions);
      setExamId(data.exam.id);
      toast.success(`Curated ${data.blueprint.totalCurated} questions from the bank`);
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
        {
          weights,
          total_questions: totalQuestions,
          questions_per_student: questionsPerStudent,
          duration_minutes: durationMinutes
        },
      );
      return data.data;
    },
    onSuccess: (data) => {
      setResults(data.assessment.questions);
      setExamId(data.exam.id);
      toast.success(`Generated ${data.assessment.total_questions} original questions via AI`);
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
    setSelectedCampuses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Assessment Wizard
          </h1>
          <p className="text-gray-500">
            Define your recruitment strategy and deploy assessments to partner campuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Library className="h-4 w-4" />
            Question Library
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-emerald-700 border border-emerald-100 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Secure Assessment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-none">Strategic Focus</h2>
                <p className="mt-2 text-sm text-gray-500 italic">Adjust sliders to define focus. Weights auto-balance.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={autoBalance}
                  className="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  Balance All
                </button>
                <button
                  onClick={resetSliders}
                  className="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {CATEGORIES.map((cat) => {
                const value = sliders[cat.key];
                return (
                  <div key={cat.key} className="group flex items-center gap-8">
                    <div className="w-48 flex-shrink-0">
                      <div className="flex items-center gap-4">
                        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-inner", cat.badge)}>
                          {cat.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{cat.key}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weighting</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-1 items-center gap-6">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => handleSlider(cat.key, parseInt(e.target.value))}
                        className="slider-thumb h-2 w-full appearance-none rounded-full bg-gray-100 outline-none"
                      />
                      <div className="w-16 text-right">
                        <span className={clsx("text-2xl font-black tabular-nums transition-colors", value > 0 ? "text-indigo-600" : "text-gray-300")}>
                          {value}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Config & Generation */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Generation Parameters</h3>
              <div className={clsx(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                isValid ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
              )}>
                {isValid ? "Calibrated (100%)" : "Unbalanced"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Pool</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Questions/Student</label>
              <input
                type="number"
                value={questionsPerStudent}
                onChange={(e) => setQuestionsPerStudent(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 p-4 text-2xl font-black text-indigo-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Duration (mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Delivery Logic</label>
              <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setMode("curator")}
                  className={clsx(
                    "flex-1 py-4 rounded-xl text-xs font-bold transition-all",
                    mode === "curator" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">📚 Curator</span>
                </button>
                <button
                  onClick={() => setMode("dynamic")}
                  className={clsx(
                    "flex-1 py-4 rounded-xl text-xs font-bold transition-all",
                    mode === "dynamic" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">🤖 Creative Drive</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!isValid || isLoading}
              className={clsx(
                "w-full rounded-2xl py-6 text-lg font-bold tracking-tight text-white transition-all active:scale-95",
                isValid && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Plus className="h-6 w-6" /> Generate Assessment
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results & Deployment ── */}
      {results && (
        <div className="mt-12 grid grid-cols-1 gap-12 border-t border-gray-100 pt-12 lg:grid-cols-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Assessment Breakdown</h3>
              <span className="rounded-xl bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-500 border border-gray-100">
                {results.length} Questions Prepared
              </span>
            </div>

            <div className="space-y-4">
              {results.slice(0, expandedIdx === null ? 5 : 50).map((q, i) => (
                <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{i + 1}</span>
                      <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 border border-indigo-100">{q.category}</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium leading-relaxed text-gray-800">{q.question_text}</p>
                </div>
              ))}
              {results.length > 5 && expandedIdx === null && (
                <button
                  onClick={() => setExpandedIdx(1)}
                  className="w-full rounded-2xl border-2 border-dashed border-gray-200 py-6 text-sm font-bold text-gray-400 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-100 transition-all uppercase tracking-widest"
                >
                  Review all {results.length} questions
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Campus Assignment</h3>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-8 space-y-8">
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {campuses?.map((campus: Campus) => (
                  <button
                    key={campus.id}
                    onClick={() => toggleCampus(campus.id)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-2xl border-2 p-5 transition-all text-gray-900",
                      selectedCampuses.includes(campus.id)
                        ? "bg-white border-indigo-600 shadow-md text-indigo-900 scale-[1.02]"
                        : "bg-white/50 border-white text-gray-400 hover:bg-white"
                    )}
                  >
                    <div className="text-left font-bold">
                      <p className="text-base">{campus.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60 font-black">{campus.city} • {campus.tier} Campus</p>
                    </div>
                    {selectedCampuses.includes(campus.id) && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-200">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => assignMutation.mutate()}
                disabled={selectedCampuses.length === 0 || assignMutation.isPending}
                className={clsx(
                  "flex w-full items-center justify-center gap-3 rounded-2xl py-6 text-lg font-bold transition-all active:scale-95",
                  selectedCampuses.length > 0 && !assignMutation.isPending
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {assignMutation.isPending ? "Deploying..." : (
                  <>
                    Host Drive for {selectedCampuses.length} Campuses
                    <ChevronRight className="h-6 w-6" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Library Drawer ── */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsLibraryOpen(false)} />
          <div className="relative w-full max-w-xl animate-in slide-in-from-right duration-300 border-l border-gray-100 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Question Library</h3>
                  <p className="text-sm text-gray-500">Browse existing questions in your bank</p>
                </div>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {qbQuestions?.map((q: any, i: number) => (
                  <div key={q.id || i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-50">{q.category}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question_text}</p>
                  </div>
                ))}
                {(!qbQuestions || qbQuestions.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Library className="h-12 w-12 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Your question bank is empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom styles ── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }

        input[type="range"].slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #f3f4f6;
          height: 8px;
          border-radius: 999px;
          cursor: pointer;
        }
        input[type="range"].slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid #6366f1;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        input[type="range"].slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.3);
        }
      `}</style>
    </div>
  );
}
