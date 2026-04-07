import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, BookOpen, Plus, Trash2, Save, Users, Clock, ChevronUp, ChevronDown, Pencil, X } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface Module { id: string; title: string; module_type: string; duration_minutes: number | null; difficulty: string; is_published: boolean; skill_name: string; }
interface ProgramModule { id: string; module_id: string; sequence_order: number; is_mandatory: boolean; title: string; module_type: string; duration_minutes: number | null; difficulty: string; }
interface Program {
  id: string; name: string; description: string; program_type: string;
  duration_days: number | null; is_active: boolean; college_name: string | null;
  target_skill_ids: string[]; eligibility_rules: any;
  modules: ProgramModule[];
  stats: { total_enrollments: number; completions: number; avg_completion_score: number };
}

const EMPTY_FORM = { name: "", description: "", program_type: "learning_path", duration_days: "", is_active: true, college_id: "" };

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const [isEditing, setIsEditing] = useState(isNew);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showAddModule, setShowAddModule] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const { data: program, isLoading } = useQuery<Program>({
    queryKey: ["skill-program", id],
    queryFn: async () => {
      const res = await api.get(`/skill-programs/${id}`);
      const p = res.data.data;
      setForm({ name: p.name, description: p.description || "", program_type: p.program_type, duration_days: String(p.duration_days || ""), is_active: p.is_active, college_id: "" });
      return p;
    },
    enabled: !isNew,
  });

  const { data: allModules = [] } = useQuery<Module[]>({
    queryKey: ["learning-modules-published"],
    queryFn: async () => (await api.get("/learning-modules?published=true")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/skill-programs", body),
    onSuccess: (res) => { toast.success("Program created"); navigate(`/app/skill-programs/${res.data.data.id}`); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/skill-programs/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-program", id] }); toast.success("Program updated"); setIsEditing(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const addModuleMutation = useMutation({
    mutationFn: (module_id: string) => api.post(`/skill-programs/${id}/modules`, { module_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-program", id] }); toast.success("Module added"); setShowAddModule(false); setSelectedModuleId(""); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Already added or not found"),
  });

  const removeModuleMutation = useMutation({
    mutationFn: (moduleId: string) => api.delete(`/skill-programs/${id}/modules/${moduleId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-program", id] }); toast.success("Module removed"); },
  });

  const reorderMutation = useMutation({
    mutationFn: (modules: { module_id: string; sequence_order: number; is_mandatory: boolean }[]) =>
      api.put(`/skill-programs/${id}/modules`, { modules }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skill-program", id] }),
  });

  const moveModule = (index: number, direction: "up" | "down") => {
    if (!program?.modules) return;
    const mods = [...program.modules].sort((a, b) => a.sequence_order - b.sequence_order);
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mods.length) return;
    [mods[index], mods[targetIdx]] = [mods[targetIdx], mods[index]];
    reorderMutation.mutate(mods.map((m, i) => ({ module_id: m.module_id, sequence_order: i + 1, is_mandatory: m.is_mandatory })));
  };

  const handleSave = () => {
    const body = { ...form, duration_days: form.duration_days ? parseInt(form.duration_days) : null, college_id: form.college_id || null };
    if (isNew) createMutation.mutate(body);
    else updateMutation.mutate(body);
  };

  if (isLoading && !isNew) return <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  const modules = (program?.modules || []).sort((a, b) => a.sequence_order - b.sequence_order);
  const usedModuleIds = new Set(modules.map(m => m.module_id));
  const availableModules = allModules.filter(m => !usedModuleIds.has(m.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate("/app/skill-programs")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Programs
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
            <div>
              <h1 className="text-3xl font-black text-slate-900">{isNew ? "New Program" : (program?.name || "")}</h1>
              {program?.college_name && <p className="text-sm text-indigo-500 font-bold mt-0.5">🏛 {program.college_name}</p>}
            </div>
          </div>
          {!isNew && (
            isEditing ? (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50">
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Program Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-900 mb-4">Program Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name *</label>
                {isEditing ? (
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                ) : <p className="text-sm font-bold text-slate-800">{program?.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Type</label>
                {isEditing ? (
                  <select value={form.program_type} onChange={e => setForm(p => ({ ...p, program_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Program type">
                    <option value="learning_path">Learning Path</option>
                    <option value="bootcamp">Bootcamp</option>
                    <option value="workshop">Workshop</option>
                    <option value="certification">Certification</option>
                  </select>
                ) : <p className="text-sm font-semibold text-slate-800 capitalize">{program?.program_type?.replace("_", " ")}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Duration (days)</label>
                {isEditing ? (
                  <input type="number" value={form.duration_days} onChange={e => setForm(p => ({ ...p, duration_days: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="30" />
                ) : <p className="text-sm font-semibold text-slate-800">{program?.duration_days ? `${program.duration_days} days` : "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                {isEditing ? (
                  <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                ) : <p className="text-sm text-slate-600">{program?.description || "—"}</p>}
              </div>
              {isEditing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                  <span className="text-sm font-bold text-slate-700">Active</span>
                </label>
              )}
              {isNew && (
                <div className="flex gap-3 mt-4">
                  <button onClick={() => navigate("/app/skill-programs")} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSave} disabled={!form.name || createMutation.isPending} className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" /> Create
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats (existing program only) */}
          {!isNew && program?.stats && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><Users className="h-4 w-4" /> Total Enrollments</span>
                  <span className="font-black text-slate-900">{program.stats.total_enrollments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><BookOpen className="h-4 w-4" /> Completions</span>
                  <span className="font-black text-emerald-600">{program.stats.completions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><Clock className="h-4 w-4" /> Avg Score</span>
                  <span className="font-black text-indigo-600">{program.stats.avg_completion_score ? `${Number(program.stats.avg_completion_score).toFixed(1)}%` : "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Modules */}
        {!isNew && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Modules ({modules.length})</h3>
                <button onClick={() => setShowAddModule(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100">
                  <Plus className="h-4 w-4" /> Add Module
                </button>
              </div>

              {showAddModule && (
                <div className="p-4 border-b border-indigo-100 bg-indigo-50/50">
                  <div className="flex items-center gap-3">
                    <select value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Select module to add">
                      <option value="">Select a module to add...</option>
                      {availableModules.map(m => <option key={m.id} value={m.id}>{m.title} ({m.module_type})</option>)}
                    </select>
                    <button onClick={() => { if (selectedModuleId) addModuleMutation.mutate(selectedModuleId); }} disabled={!selectedModuleId || addModuleMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-indigo-500 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50">Add</button>
                    <button onClick={() => { setShowAddModule(false); setSelectedModuleId(""); }} className="p-2.5 rounded-xl hover:bg-white"><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                </div>
              )}

              {modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No modules yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add published modules to this program</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {modules.map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveModule(idx, "up")} disabled={idx === 0} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveModule(idx, "down")} disabled={idx === modules.length - 1} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="w-6 text-center text-xs font-black text-slate-300">{m.sequence_order}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{m.title}</p>
                        <p className="text-xs text-slate-400 capitalize">{m.module_type?.replace("_", " ")} {m.duration_minutes ? `· ${m.duration_minutes} min` : ""}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.is_mandatory ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"}`}>
                        {m.is_mandatory ? "Mandatory" : "Optional"}
                      </span>
                      <button onClick={() => { if (confirm("Remove this module?")) removeModuleMutation.mutate(m.module_id); }}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
