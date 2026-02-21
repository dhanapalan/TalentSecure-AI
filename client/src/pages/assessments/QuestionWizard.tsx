// =============================================================================
// TalentSecure AI — Assessment Blueprint Wizard
// =============================================================================
// Slider UI for companies to allocate 100% across exam categories,
// then generate AI-powered questions via the backend LLM endpoint.
// =============================================================================

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import api from "../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryAllocation {
  category: string;
  percentage: number;
  color: string;
  icon: string;
}

interface MCQQuestion {
  type: "mcq";
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

interface CodingChallenge {
  type: "coding";
  category: string;
  difficulty: string;
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  hiddenTestCases: { input: string; expectedOutput: string }[];
  starterCode: Record<string, string>;
  marks: number;
  timeLimitMs: number;
  memoryLimitKb: number;
}

type AssessmentQuestion = MCQQuestion | CodingChallenge;

interface GeneratedAssessment {
  title: string;
  totalMarks: number;
  totalQuestions: number;
  categories: { category: string; percentage: number }[];
  questions: AssessmentQuestion[];
}

// ── Default categories ───────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: CategoryAllocation[] = [
  { category: "Reasoning", percentage: 20, color: "bg-blue-500", icon: "🧠" },
  { category: "Maths", percentage: 20, color: "bg-emerald-500", icon: "📐" },
  { category: "Aptitude", percentage: 20, color: "bg-amber-500", icon: "💡" },
  { category: "Data Structures", percentage: 20, color: "bg-purple-500", icon: "🌳" },
  { category: "Programming", percentage: 20, color: "bg-rose-500", icon: "💻" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function QuestionWizard() {
  const [categories, setCategories] = useState<CategoryAllocation[]>(DEFAULT_CATEGORIES);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [generatedAssessment, setGeneratedAssessment] = useState<GeneratedAssessment | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Sum of all percentages
  const totalPercentage = categories.reduce((s, c) => s + c.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.5;

  // ── Slider change handler ─────────────────────────────────────────────────

  const handleSliderChange = useCallback(
    (index: number, newValue: number) => {
      setCategories((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], percentage: newValue };
        return updated;
      });
    },
    [],
  );

  // Auto-balance: distribute remaining to get exactly 100%
  const autoBalance = useCallback(() => {
    setCategories((prev) => {
      const total = prev.reduce((s, c) => s + c.percentage, 0);
      if (total === 100) return prev;

      const diff = 100 - total;
      const perCategory = Math.floor(diff / prev.length);
      const remainder = diff - perCategory * prev.length;

      return prev.map((c, i) => ({
        ...c,
        percentage: c.percentage + perCategory + (i < remainder ? 1 : 0),
      }));
    });
  }, []);

  // Reset to equal distribution
  const resetEqual = useCallback(() => {
    setCategories((prev) =>
      prev.map((c) => ({ ...c, percentage: 20 })),
    );
  }, []);

  // ── Generate Assessment mutation ──────────────────────────────────────────

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        categories: categories.map((c) => ({
          category: c.category,
          percentage: c.percentage,
        })),
        totalQuestions,
      };
      const { data } = await api.post("/exams/generate", payload);
      return data.data as GeneratedAssessment;
    },
    onSuccess: (data) => {
      setGeneratedAssessment(data);
      toast.success(
        `Assessment generated! ${data.totalQuestions} questions, ${data.totalMarks} marks`,
      );
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to generate assessment",
      );
    },
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Assessment Blueprint Wizard
        </h1>
        <p className="mt-1 text-gray-500">
          Allocate percentages across exam categories and let AI generate
          tailored questions for your assessment.
        </p>
      </div>

      {/* Allocation Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Category Allocation
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "text-sm font-medium px-3 py-1 rounded-full",
                isValid
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              Total: {totalPercentage}%
            </span>
            <button
              onClick={autoBalance}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Auto-balance
            </button>
            <button
              onClick={resetEqual}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Percentage bar visualization */}
        <div className="h-4 w-full rounded-full overflow-hidden flex mb-8 bg-gray-100">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className={clsx(cat.color, "transition-all duration-300")}
              style={{ width: `${cat.percentage}%` }}
              title={`${cat.category}: ${cat.percentage}%`}
            />
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {categories.map((cat, index) => (
            <div key={cat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-gray-700">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cat.percentage}
                    onChange={(e) =>
                      handleSliderChange(
                        index,
                        Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                      )
                    }
                    className="w-16 text-right text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-400 w-4">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={cat.percentage}
                onChange={(e) =>
                  handleSliderChange(index, parseInt(e.target.value))
                }
                className={clsx(
                  "w-full h-2 rounded-lg appearance-none cursor-pointer",
                  "bg-gray-200 accent-current",
                  cat.color.replace("bg-", "text-"),
                )}
              />

              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>
                  ~{Math.max(1, Math.round((cat.percentage / 100) * totalQuestions))}{" "}
                  questions
                </span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings + Generate */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Questions
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={totalQuestions}
              onChange={(e) =>
                setTotalQuestions(
                  Math.max(5, Math.min(100, parseInt(e.target.value) || 20)),
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Between 5 and 100 questions
            </p>
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={!isValid || generateMutation.isPending}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-white transition-all",
              "flex items-center gap-2",
              isValid && !generateMutation.isPending
                ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-400 cursor-not-allowed",
            )}
          >
            {generateMutation.isPending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating with AI…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                Generate Assessment
              </>
            )}
          </button>
        </div>

        {!isValid && (
          <p className="mt-3 text-sm text-red-600">
            Category percentages must add up to exactly 100%. Current total:{" "}
            {totalPercentage}%
          </p>
        )}
      </div>

      {/* Generated Assessment Preview */}
      {generatedAssessment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {generatedAssessment.title}
              </h2>
              <p className="text-sm text-gray-500">
                {generatedAssessment.totalQuestions} questions •{" "}
                {generatedAssessment.totalMarks} total marks
              </p>
            </div>
            <div className="flex gap-2">
              {generatedAssessment.categories?.map((cat) => (
                <span
                  key={cat.category}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {cat.category}: {cat.percentage}%
                </span>
              ))}
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {generatedAssessment.questions.map((q, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Question header */}
                <button
                  onClick={() =>
                    setExpandedQuestion(expandedQuestion === i ? null : i)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-400 w-8">
                      Q{i + 1}
                    </span>
                    <span
                      className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        q.type === "mcq"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700",
                      )}
                    >
                      {q.type === "mcq" ? "MCQ" : "Coding"}
                    </span>
                    <span className="text-sm text-gray-700 text-left">
                      {q.type === "mcq" ? q.question.slice(0, 80) : q.title}
                      {q.type === "mcq" && q.question.length > 80 ? "…" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full",
                        q.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : q.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {q.marks} marks
                    </span>
                    <span className="text-xs text-gray-400">{q.category}</span>
                    <svg
                      className={clsx(
                        "h-4 w-4 text-gray-400 transition-transform",
                        expandedQuestion === i && "rotate-180",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {expandedQuestion === i && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {q.type === "mcq" ? (
                      <div className="space-y-3 pt-3">
                        <p className="text-sm text-gray-800">{q.question}</p>
                        <div className="grid gap-2">
                          {q.options.map((opt, oi) => (
                            <div
                              key={oi}
                              className={clsx(
                                "text-sm px-3 py-2 rounded-md border",
                                oi === q.correctAnswer
                                  ? "border-green-300 bg-green-50 text-green-800"
                                  : "border-gray-200 text-gray-600",
                              )}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              {opt}
                              {oi === q.correctAnswer && (
                                <span className="ml-2 text-green-600">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {q.description}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Sample Input
                            </p>
                            <pre className="text-xs text-gray-700 font-mono">
                              {q.sampleInput}
                            </pre>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Sample Output
                            </p>
                            <pre className="text-xs text-gray-700 font-mono">
                              {q.sampleOutput}
                            </pre>
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-md p-3">
                          <p className="text-xs font-medium text-amber-700">
                            Constraints
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            {q.constraints}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Hidden test cases: {q.hiddenTestCases.length} •
                          Time limit: {q.timeLimitMs}ms •
                          Memory limit: {(q.memoryLimitKb / 1024).toFixed(0)}MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
