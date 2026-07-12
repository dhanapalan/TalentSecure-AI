import { useRef, useState } from "react";
import { FileUp, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import questionBankService from "../../../services/questionBankService";

// Must match the server's question_category enum (questionBank.routes.ts).
const CATEGORIES = [
  { value: "aptitude", label: "Aptitude" },
  { value: "reasoning", label: "Reasoning" },
  { value: "maths", label: "Maths" },
  { value: "data_structures", label: "Data Structures" },
  { value: "programming", label: "Programming" },
  { value: "python_coding", label: "Python Coding" },
  { value: "java_coding", label: "Java Coding" },
  { value: "data_science", label: "Data Science" },
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

interface PreviewQuestion {
  number: number;
  question_text: string;
  options: string[];
  correct_answer: string | null; // index into options, as string
  explanation: string | null;
  needs_answer: boolean;
  included: boolean;
}

export default function PdfImportSection({ onImported }: { onImported?: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [category, setCategory] = useState("aptitude");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");

  const reset = () => {
    setQuestions([]);
    setWarnings([]);
    setFileName(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await questionBankService.parsePdfQuestions(file);
      setFileName(result.filename);
      setWarnings(result.warnings);
      setQuestions(
        result.questions.map((q) => ({ ...q, included: true }))
      );
      if (result.questions.length === 0) {
        toast.error("No questions could be parsed from this PDF");
      } else {
        toast.success(`Parsed ${result.questions.length} questions from ${result.meta.pages} page(s)`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to parse PDF");
      console.error(error);
    } finally {
      setParsing(false);
    }
  };

  const setAnswer = (idx: number, answerIdx: number) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === idx ? { ...q, correct_answer: String(answerIdx), needs_answer: false } : q
      )
    );
  };

  const toggleIncluded = (idx: number) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, included: !q.included } : q)));
  };

  const included = questions.filter((q) => q.included);
  const unanswered = included.filter((q) => q.correct_answer === null);

  const handleImport = async () => {
    if (included.length === 0 || unanswered.length > 0) return;
    setImporting(true);
    try {
      const slug = (fileName || "document")
        .toLowerCase()
        .replace(/\.pdf$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      const payload = included.map((q) => ({
        category,
        type: "multiple_choice",
        difficulty_level: difficulty,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer as string,
        explanation: q.explanation || undefined,
        tags: ["pdf-import", `pdf-${slug}`],
      }));
      const result = await questionBankService.bulkCreateQuestions(payload);
      if (result.errors.length > 0) {
        toast.error(`Imported ${result.created}, ${result.errors.length} failed — see console`);
        console.error("PDF import row errors:", result.errors);
      } else {
        toast.success(`Imported ${result.created} questions from ${fileName}`);
      }
      reset();
      onImported?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/70 shadow-admin-card mb-8">
      {/* Header + upload controls */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-admin-accent" />
              Import from PDF
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload a text-based PDF of numbered multiple-choice questions (options A–E, answers
              inline or in a trailing answer key). Parsed questions are shown for review before
              anything is saved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              title="Category applied to all imported questions"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize"
              title="Difficulty applied to all imported questions"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={parsing}
              className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {parsing ? "Parsing…" : "Choose PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle className="w-4 h-4" /> Parser notes
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {questions.length > 0 && (
        <>
          <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className={`px-6 py-4 ${!q.included ? "opacity-40" : ""} ${q.included && q.correct_answer === null ? "bg-amber-50/60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={q.included}
                    onChange={() => toggleIncluded(idx)}
                    className="mt-1.5 h-4 w-4 rounded border-gray-300"
                    title={q.included ? "Exclude from import" : "Include in import"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-gray-400 mr-1.5">Q{q.number}.</span>
                      {q.question_text}
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer ${
                            q.correct_answer === String(oi)
                              ? "border-green-300 bg-green-50 text-green-900"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pdf-q-${idx}`}
                            checked={q.correct_answer === String(oi)}
                            onChange={() => setAnswer(idx, oi)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="font-medium text-gray-400">{String.fromCharCode(65 + oi)}.</span>
                          <span className="flex-1">{opt}</span>
                          {q.correct_answer === String(oi) && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                    {q.included && q.correct_answer === null && (
                      <p className="mt-1.5 text-xs font-medium text-amber-700">
                        No answer detected — select the correct option above (or exclude this question).
                      </p>
                    )}
                    {q.explanation && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        <span className="font-medium">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{included.length}</span> of {questions.length} selected
              {unanswered.length > 0 && (
                <span className="text-amber-700"> · {unanswered.length} still need an answer</span>
              )}
              {fileName && <span className="text-gray-400"> · {fileName}</span>}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || included.length === 0 || unanswered.length > 0}
                className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title={unanswered.length > 0 ? "Every included question needs a correct answer" : undefined}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {importing ? "Importing…" : `Import ${included.length} Question${included.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
