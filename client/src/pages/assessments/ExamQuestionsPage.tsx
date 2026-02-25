// =============================================================================
// TalentSecure AI — Exam Questions Viewer + Campus Assignment
// =============================================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import api from "../../lib/api";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Question {
  id: string;
  sort_order: number;
  category: string;
  type: string;
  difficulty_level: string;
  question_text: string;
  options?: string[];
  correct_answer?: string;
  test_cases?: { input: string; expectedOutput: string }[];
}

interface Exam {
  id: string;
  title: string;
  duration: number;
  duration_minutes?: number;
  total_questions?: number;
  is_active: boolean;
  scheduled_time: string;
  created_at: string;
}

interface College {
  id: string;
  name: string;
  city?: string;
  tier?: string;
}

/* ── Category badge colors ──────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  reasoning: "bg-blue-50 text-blue-700 border-blue-100",
  maths: "bg-orange-50 text-orange-700 border-orange-100",
  aptitude: "bg-amber-50 text-amber-700 border-amber-100",
  data_structures: "bg-purple-50 text-purple-700 border-purple-100",
  programming: "bg-emerald-50 text-emerald-700 border-emerald-100",
  python_coding: "bg-green-50 text-green-700 border-green-100",
  java_coding: "bg-red-50 text-red-700 border-red-100",
  data_science: "bg-cyan-50 text-cyan-700 border-cyan-100",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-50 text-green-600 border-green-100",
  medium: "bg-yellow-50 text-yellow-600 border-yellow-100",
  hard: "bg-red-50 text-red-600 border-red-100",
};

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function ExamQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");

  // ── Fetch exam questions ──
  const { data, isLoading, error } = useQuery({
    queryKey: ["exam-questions", id],
    queryFn: async () => {
      const { data } = await api.get(`/exams/${id}/questions`);
      return data.data as {
        exam: Exam;
        questions: Question[];
        assignedColleges: College[];
      };
    },
    enabled: !!id,
  });

  // ── Fetch all colleges for assignment ──
  const { data: allColleges } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return data.data as College[];
    },
  });

  // ── Assign mutation ──
  const assignMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/exams/${id}/assign`, { campus_ids: selectedColleges });
    },
    onSuccess: () => {
      toast.success("Exam assigned to selected colleges!");
      setSelectedColleges([]);
      queryClient.invalidateQueries({ queryKey: ["exam-questions", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to assign exam");
    },
  });

  const toggleCollege = (cid: string) => {
    setSelectedColleges((prev) =>
      prev.includes(cid) ? prev.filter((c) => c !== cid) : [...prev, cid],
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-10 w-10 animate-spin text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Loading exam questions…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">No questions found</p>
          <p className="mt-1 text-sm text-gray-500">This exam has no questions linked yet.</p>
          <Link to="/app/assessments" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            ← Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const { exam, questions, assignedColleges } = data;

  // Category breakdown
  const categoryBreakdown = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  const difficultyBreakdown = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.difficulty_level] = (acc[q.difficulty_level] || 0) + 1;
    return acc;
  }, {});

  const filteredQuestions =
    filter === "all" ? questions : questions.filter((q) => q.category === filter);

  const categories = Object.keys(categoryBreakdown);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          to="/app/assessments"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {exam.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-100">
                <FileText className="h-3.5 w-3.5" />
                {questions.length} Questions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-100">
                <Clock className="h-3.5 w-3.5" />
                {exam.duration_minutes ?? exam.duration} min
              </span>
              <span
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-bold border",
                  exam.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-gray-50 text-gray-400 border-gray-100",
                )}
              >
                {exam.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/app/assessments/blueprint"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Create New
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? "all" : cat)}
            className={clsx(
              "rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md",
              filter === cat
                ? "border-indigo-500 bg-indigo-50/50 shadow-md"
                : "border-gray-100 bg-white hover:border-gray-200",
            )}
          >
            <p className="text-2xl font-black text-gray-900">{categoryBreakdown[cat]}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">
              {cat.replace(/_/g, " ")}
            </p>
          </button>
        ))}
      </div>

      {/* Difficulty summary */}
      <div className="mb-8 flex flex-wrap gap-3">
        {Object.entries(difficultyBreakdown).map(([diff, count]) => (
          <span
            key={diff}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-bold border",
              DIFFICULTY_COLORS[diff] ?? "bg-gray-50 text-gray-500 border-gray-100",
            )}
          >
            {diff}: {count}
          </span>
        ))}
        {filter !== "all" && (
          <button
            onClick={() => setFilter("all")}
            className="rounded-full px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            Clear filter ×
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* ── Questions List ── */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Questions {filter !== "all" && <span className="text-indigo-500">({filter.replace(/_/g, " ")})</span>}
          </h2>

          {filteredQuestions.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No questions match this filter.</p>
          ) : (
            filteredQuestions.map((q, i) => {
              const isExpanded = expandedQ === i;
              return (
                <div
                  key={q.id}
                  className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Question header — always visible */}
                  <button
                    onClick={() => setExpandedQ(isExpanded ? null : i)}
                    className="flex w-full items-start gap-4 p-6 text-left"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {q.sort_order + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={clsx(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                            CATEGORY_COLORS[q.category] ?? "bg-gray-50 text-gray-500 border-gray-100",
                          )}
                        >
                          {q.category.replace(/_/g, " ")}
                        </span>
                        <span
                          className={clsx(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                            DIFFICULTY_COLORS[q.difficulty_level] ?? "bg-gray-50 text-gray-500 border-gray-100",
                          )}
                        >
                          {q.difficulty_level}
                        </span>
                        <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-100">
                          {q.type === "coding_challenge" ? "Coding" : "MCQ"}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-gray-800 line-clamp-2">
                        {q.question_text}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-6 pb-6 pt-4 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {q.question_text}
                      </p>

                      {/* MCQ options */}
                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Options</p>
                          {(q.options as string[]).map((opt, oi) => (
                            <div
                              key={oi}
                              className={clsx(
                                "rounded-xl border px-4 py-3 text-sm",
                                String(oi) === String(q.correct_answer)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                                  : "border-gray-100 bg-gray-50 text-gray-600",
                              )}
                            >
                              <span className="mr-2 font-bold text-gray-400">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              {String(opt)}
                              {String(oi) === String(q.correct_answer) && (
                                <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Coding test cases */}
                      {q.test_cases && Array.isArray(q.test_cases) && q.test_cases.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Test Cases</p>
                          {q.test_cases.map((tc, ti) => (
                            <div key={ti} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-mono">
                              <p><span className="font-bold text-gray-500">Input:</span> {tc.input}</p>
                              <p><span className="font-bold text-gray-500">Expected:</span> {tc.expectedOutput}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Column: Campus Assignment ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Already assigned colleges */}
          {assignedColleges.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6">
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Assigned Colleges
              </h3>
              <div className="mt-4 space-y-2">
                {assignedColleges.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl bg-white border border-emerald-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.name}</p>
                      {c.city && (
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                          {c.city} {c.tier && `• ${c.tier}`}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assign to new colleges */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Assign to Colleges
            </h3>
            <p className="mt-1 text-xs text-gray-400">Deploy this assessment to partner campuses.</p>

            <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {allColleges?.map((college) => {
                const alreadyAssigned = assignedColleges.some((ac) => ac.id === college.id);
                return (
                  <button
                    key={college.id}
                    onClick={() => !alreadyAssigned && toggleCollege(college.id)}
                    disabled={alreadyAssigned}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all text-left",
                      alreadyAssigned
                        ? "border-emerald-100 bg-emerald-50/50 cursor-default opacity-60"
                        : selectedColleges.includes(college.id)
                          ? "border-indigo-500 bg-indigo-50/50 shadow-md"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm",
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{college.name}</p>
                      {college.city && (
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">
                          {college.city} {college.tier && `• ${college.tier}`}
                        </p>
                      )}
                    </div>
                    {alreadyAssigned ? (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        Assigned
                      </span>
                    ) : selectedColleges.includes(college.id) ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
              {(!allColleges || allColleges.length === 0) && (
                <p className="text-sm text-gray-400 py-4 text-center">No colleges found.</p>
              )}
            </div>

            <button
              onClick={() => assignMutation.mutate()}
              disabled={selectedColleges.length === 0 || assignMutation.isPending}
              className={clsx(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all",
                selectedColleges.length > 0 && !assignMutation.isPending
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              {assignMutation.isPending ? (
                "Deploying…"
              ) : (
                <>
                  Deploy to {selectedColleges.length} College{selectedColleges.length !== 1 ? "s" : ""}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
