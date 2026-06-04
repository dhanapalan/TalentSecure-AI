// =============================================================================
// JD Extract Page — paste a Job Description, get skill distribution from Claude
// Company can then click "Create Assessment Rule" to pre-fill the Rule Wizard
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import {
  FileText, Sparkles, Loader2, ChevronRight, RotateCcw,
  Target, Clock, BarChart3, CheckCircle2, BookOpen, AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface JDResult {
  role_title: string;
  experience_level: string;
  skill_distribution: Record<string, number>;
  difficulty_mix: Record<string, number>;
  key_requirements: string[];
  suggested_duration_minutes: number;
  suggested_total_questions: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const EXP_LABEL: Record<string, string> = {
  fresher: "Fresher / Graduate",
  junior:  "Junior (1–2 yrs)",
  mid:     "Mid-level (3–5 yrs)",
  senior:  "Senior (5+ yrs)",
  lead:    "Lead / Staff",
};

const DIFF_COLOR: Record<string, string> = {
  Easy:   "bg-emerald-400",
  Medium: "bg-amber-400",
  Hard:   "bg-rose-400",
};

const SKILL_COLOR = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500",
  "bg-teal-500", "bg-purple-500",
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JDExtractPage() {
  const navigate = useNavigate();
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDResult | null>(null);
  const [error, setError] = useState("");

  const extract = async () => {
    if (!jdText.trim()) { setError("Please paste a job description first."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/company/jd/extract", { jd_text: jdText });
      setResult(res.data.data as JDResult);
    } catch (e: any) {
      setError(e.response?.data?.error || "Extraction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createRule = () => {
    if (!result) return;
    navigate("/app/assessment-rules/wizard", {
      state: {
        prefill: {
          name: `${result.role_title} Assessment`,
          target_role: result.role_title,
          skill_distribution: result.skill_distribution,
          difficulty_distribution: result.difficulty_mix,
          duration_minutes: result.suggested_duration_minutes,
          total_questions: result.suggested_total_questions,
        },
      },
    });
  };

  const skillEntries = result ? Object.entries(result.skill_distribution).sort((a, b) => b[1] - a[1]) : [];
  const diffEntries  = result ? Object.entries(result.difficulty_mix) : [];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" /> JD Skill Extractor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Paste a job description — Claude extracts the skill distribution and pre-fills your assessment rule
          </p>
        </div>
        {result && (
          <button
            onClick={() => { setResult(null); setJdText(""); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </button>
        )}
      </div>

      {!result ? (
        /* ── Input panel ──────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <label className="block text-xs font-black text-slate-700">
            Job Description
          </label>
          <textarea
            value={jdText}
            onChange={e => { setJdText(e.target.value); setError(""); }}
            rows={14}
            placeholder={`Paste the full job description here…\n\nExample:\nWe are looking for a Senior Backend Engineer with 4+ years experience in Node.js and Python. The ideal candidate should be proficient in system design, data structures, REST APIs, SQL/NoSQL databases…`}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none font-mono leading-relaxed"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              {jdText.length.toLocaleString()} / 20 000 chars
            </p>
            <button
              onClick={extract}
              disabled={loading || !jdText.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</>
                : <><Sparkles className="h-4 w-4" /> Extract Skills</>}
            </button>
          </div>
        </div>
      ) : (
        /* ── Results panel ────────────────────────────────────────────── */
        <div className="space-y-5">

          {/* Role header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-indigo-200 text-xs font-semibold mb-0.5">Extracted Role</p>
                <h2 className="text-xl font-black">{result.role_title}</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  {EXP_LABEL[result.experience_level] ?? result.experience_level}
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-2xl font-black">{result.suggested_total_questions}</p>
                  <p className="text-indigo-200 text-xs">questions</p>
                </div>
                <div>
                  <p className="text-2xl font-black">{result.suggested_duration_minutes}</p>
                  <p className="text-indigo-200 text-xs">minutes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Skill distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" /> Skill Distribution
              </h3>

              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {skillEntries.map(([skill, pct], i) => (
                  <div
                    key={skill}
                    className={`${SKILL_COLOR[i % SKILL_COLOR.length]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${skill}: ${pct}%`}
                  />
                ))}
              </div>

              <div className="space-y-2.5">
                {skillEntries.map(([skill, pct], i) => (
                  <div key={skill} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${SKILL_COLOR[i % SKILL_COLOR.length]}`} />
                    <span className="flex-1 text-sm text-slate-700 font-medium truncate">{skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div className={`${SKILL_COLOR[i % SKILL_COLOR.length]} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-800 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: difficulty + key requirements */}
            <div className="space-y-4">
              {/* Difficulty mix */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-amber-400" /> Difficulty Mix
                </h3>
                <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
                  {diffEntries.map(([level, pct]) => (
                    <div key={level} className={`${DIFF_COLOR[level] ?? "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                  ))}
                </div>
                <div className="flex gap-4">
                  {diffEntries.map(([level, pct]) => (
                    <div key={level} className="text-center">
                      <div className={`text-lg font-black ${level === "Easy" ? "text-emerald-600" : level === "Medium" ? "text-amber-500" : "text-rose-500"}`}>
                        {pct}%
                      </div>
                      <div className="text-xs text-slate-400">{level}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key requirements */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-violet-400" /> Key Requirements
                </h3>
                <ul className="space-y-2">
                  {result.key_requirements.map((req, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested config */}
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Suggested Config
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-indigo-400 text-xs font-semibold">Duration</p>
                    <p className="font-black text-indigo-800">{result.suggested_duration_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-indigo-400 text-xs font-semibold">Questions</p>
                    <p className="font-black text-indigo-800">{result.suggested_total_questions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={createRule}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-indigo-200"
            >
              <Sparkles className="h-4 w-4" /> Create Assessment Rule from this JD
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-5 rounded-xl border border-slate-200 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Try another JD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
