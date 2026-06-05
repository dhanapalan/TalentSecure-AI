// =============================================================================
// Campus Setup — /app/company/campus-setup
// Company registers a college then bulk-imports students for a campus drive
// Step 1: Register college (name, city, state)
// Step 2: Upload student CSV
// =============================================================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import {
  GraduationCap, Upload, CheckCircle2, ChevronRight,
  Loader2, ArrowLeft, Building2, Users, Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

interface College { id: string; name: string; city: string | null; student_count: number; created_at: string }

export default function CampusSetupPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState<"list" | "create" | "import">("list");
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  // College creation form
  const [collegeName, setCollegeName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["company-campuses"],
    queryFn: () => api.get("/company/campuses").then(r => r.data.data as College[]),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/company/campuses", { name: collegeName, city, state }),
    onSuccess: (res) => {
      toast.success("College registered!");
      qc.invalidateQueries({ queryKey: ["company-campuses"] });
      setSelectedCollege(res.data.data);
      setCollegeName(""); setCity(""); setState("");
      setStep("import");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to register college"),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !selectedCollege) return;
      const fd = new FormData();
      fd.append("file", csvFile);
      fd.append("college_id", selectedCollege.id);
      const { data } = await api.post("/campus/students/bulk-import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (res) => {
      const r = res?.data ?? res;
      setImportResult({ created: r?.created ?? 0, skipped: r?.skipped ?? 0 });
      qc.invalidateQueries({ queryKey: ["company-campuses"] });
      toast.success(`${r?.created ?? 0} students imported!`);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Import failed"),
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/app/company" className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">Campus Setup</h1>
          <p className="text-sm text-slate-500 mt-0.5">Register a college and add students for campus interviews</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { key: "list",   label: "Your Colleges" },
          { key: "create", label: "Register College" },
          { key: "import", label: "Import Students" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              step === s.key ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
            }`}>{i + 1}</div>
            <span className={`text-xs font-bold ${step === s.key ? "text-indigo-700" : "text-slate-400"}`}>{s.label}</span>
            {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ── Step: College list ──────────────────────────────────────────── */}
      {step === "list" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : colleges.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <GraduationCap className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No colleges registered yet</p>
              <p className="text-xs text-slate-300 mt-1">Register your first college to start campus hiring</p>
            </div>
          ) : (
            <div className="space-y-2">
              {colleges.map(col => (
                <div key={col.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{col.name}</p>
                    <p className="text-xs text-slate-400">{col.city ?? "—"} · {col.student_count} students</p>
                  </div>
                  <button
                    onClick={() => { setSelectedCollege(col); setStep("import"); }}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" /> Add Students
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep("create")}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" /> Register New College
          </button>
        </div>
      )}

      {/* ── Step: Create college ────────────────────────────────────────── */}
      {step === "create" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-500" /> Register a College
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name *</label>
            <input type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)}
              placeholder="e.g. Sri Venkateswara College of Engineering"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Chennai"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
              <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="Tamil Nadu"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep("list")} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !collegeName.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</> : "Register College"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Import students ───────────────────────────────────────── */}
      {step === "import" && selectedCollege && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-indigo-800">{selectedCollege.name}</p>
              <p className="text-xs text-indigo-500">College selected for import</p>
            </div>
          </div>

          {importResult ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="font-black text-slate-900 text-lg">Import Complete</p>
              <div className="flex justify-center gap-6">
                <div><p className="text-2xl font-black text-emerald-600">{importResult.created}</p><p className="text-xs text-slate-400">Created</p></div>
                <div><p className="text-2xl font-black text-slate-400">{importResult.skipped}</p><p className="text-xs text-slate-400">Skipped</p></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setImportResult(null); setCsvFile(null); }} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Import More
                </button>
                <Link to="/app/drives/create" className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-bold text-center hover:bg-indigo-700 transition-colors">
                  Create Drive →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-500" /> Import Students via CSV
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-700 mb-2">CSV format:</p>
                <p><code className="bg-slate-200 px-1 rounded">first_name, last_name, email, phone, degree, passing_year</code></p>
                <p>• One student per row. Email is required (used as login).</p>
                <p>• Students will receive a temporary password by email.</p>
              </div>

              <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${csvFile ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"}`}>
                <Upload className={`h-8 w-8 ${csvFile ? "text-indigo-500" : "text-slate-300"}`} />
                {csvFile
                  ? <span className="text-sm font-bold text-indigo-700">{csvFile.name}</span>
                  : <span className="text-sm text-slate-400">Click to upload CSV or drag and drop</span>}
                <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep("list")} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Back
                </button>
                <button
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending || !csvFile}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  {importMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="h-4 w-4" /> Import Students</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
