import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  SparklesIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

interface GeneratedQuestion {
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  selected?: boolean;
  category?: string;
}

const CATEGORIES = [
  "aptitude", "reasoning", "maths", "data_structures",
  "programming", "python_coding", "java_coding", "data_science",
];

export default function AIQuestionGeneratorPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [useRag, setUseRag] = useState(true);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);

  // Engine health
  const { data: health } = useQuery({
    queryKey: ["qb-ai-health"],
    queryFn: async () => {
      const { data } = await api.get("/qb-ai/health");
      return data.data;
    },
    refetchInterval: 30_000,
  });
  const engineOnline: boolean = !!health?.online;

  // Document upload
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post("/qb-ai/documents", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res: any) => {
      const d = res.data?.data;
      toast.success(
        `Document ingested: ${d?.chunks_created ?? d?.total_chunks ?? "?"} chunks added to knowledge base`
      );
      queryClient.invalidateQueries({ queryKey: ["qb-ai-health"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Upload failed");
    },
  });

  // Question generation
  const generateMutation = useMutation({
    mutationFn: async () =>
      api.post("/qb-ai/generate", {
        topic,
        difficulty,
        question_type: "multiple_choice",
        count,
        use_rag: useRag,
      }),
    onSuccess: (res: any) => {
      const qs: GeneratedQuestion[] = res.data?.data?.questions || [];
      if (qs.length === 0) {
        toast.error("Engine returned no questions — check its logs");
        return;
      }
      setGenerated(qs.map((q) => ({ ...q, selected: true, category: "aptitude" })));
      toast.success(`Generated ${qs.length} question(s) — review and import`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Generation failed");
    },
  });

  // Import into question bank
  const importMutation = useMutation({
    mutationFn: async () => {
      const selected = generated
        .filter((q) => q.selected)
        .map((q) => ({
          question: q.question,
          options: q.options || [],
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          category: q.category || "aptitude",
          difficulty: (["easy", "medium", "hard"].includes(q.difficulty || "") ? q.difficulty : difficulty) as
            | "easy" | "medium" | "hard",
          tags: ["ai-generated", topic.toLowerCase().replace(/\s+/g, "-")],
          marks: 1,
        }));
      return api.post("/qb-ai/import", { questions: selected });
    },
    onSuccess: (res: any) => {
      toast.success(res.data?.message || "Questions imported");
      setGenerated([]);
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Import failed");
    },
  });

  const selectedCount = generated.filter((q) => q.selected).length;

  const toggleQuestion = (idx: number) => {
    setGenerated((prev) => prev.map((q, i) => (i === idx ? { ...q, selected: !q.selected } : q)));
  };

  const setCategory = (idx: number, category: string) => {
    setGenerated((prev) => prev.map((q, i) => (i === idx ? { ...q, category } : q)));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            AI Question Generator
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload study material, generate RAG-grounded questions, review, and publish to the question bank
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
            engineOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <CpuChipIcon className="h-4 w-4" />
          {engineOnline ? "Engine Online" : "Engine Offline"}
        </div>
      </div>

      {/* Offline hint */}
      {!engineOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">The AI engine is not running.</p>
          <p>
            Start it with{" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
              cd ai-engine/question_bank_engine && python -m api
            </code>{" "}
            (requires a GROQ_API_KEY or other LLM provider in its .env). This page will detect it automatically.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
            1. Upload Study Material
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            PDF, DOCX, TXT or Markdown — chunked and embedded into the knowledge base (ChromaDB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!engineOnline || uploadMutation.isPending}
            className="w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl text-gray-600 font-bold hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? "Uploading & embedding..." : "Click to upload a document"}
          </button>
          {health?.engine?.knowledge_base && (
            <p className="text-xs text-gray-500 mt-3">
              Knowledge base: {health.engine.knowledge_base.total_chunks ?? 0} chunks ·{" "}
              {health.engine.knowledge_base.unique_documents ?? 0} documents
            </p>
          )}
        </div>

        {/* Generate card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-indigo-600" />
            2. Generate Questions
          </h2>
          <p className="text-sm text-gray-500 mb-4">Topic-based generation, grounded in your uploaded content</p>

          <div className="space-y-4">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic — e.g. Percentages, Time & Work, Syllogism"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <div className="flex gap-3">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-gray-700"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-gray-700"
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 font-bold">
              <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} />
              Use knowledge base (RAG) for accuracy
            </label>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={!engineOnline || topic.trim().length < 3 || generateMutation.isPending}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? "Generating (may take up to a minute)..." : "Generate Questions"}
            </button>
          </div>
        </div>
      </div>

      {/* Review & import */}
      {generated.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              3. Review — {selectedCount} of {generated.length} selected
            </h2>
            <button
              onClick={() => importMutation.mutate()}
              disabled={selectedCount === 0 || importMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {importMutation.isPending ? "Importing..." : `Import ${selectedCount} to Question Bank`}
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {generated.map((q, idx) => (
              <div key={idx} className={`p-6 ${q.selected ? "" : "opacity-50"}`}>
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleQuestion(idx)} className="mt-0.5 flex-shrink-0">
                    {q.selected ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-3">{q.question}</p>
                    {q.options && q.options.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {q.options.map((opt, oi) => (
                          <li
                            key={oi}
                            className={`text-sm px-3 py-1.5 rounded-lg ${
                              opt === q.correct_answer
                                ? "bg-green-50 text-green-800 font-bold"
                                : "bg-slate-50 text-gray-700"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.explanation && (
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
                        <span className="font-bold">Explanation: </span>
                        {q.explanation}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <select
                        value={q.category}
                        onChange={(e) => setCategory(idx, e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-gray-700"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-gray-600 capitalize">
                        {q.difficulty || difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
