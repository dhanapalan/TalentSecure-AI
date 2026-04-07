import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Video, Code2, ClipboardList, BookOpen, Users, Radio, Eye, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface Module {
  id: string;
  title: string;
  description: string;
  module_type: string;
  skill_name: string;
  category_name: string;
  duration_minutes: number | null;
  difficulty: string;
  is_published: boolean;
  passing_score: number;
  content_url: string;
}

interface Skill { id: string; name: string; category_name: string; }

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Video; color: string }> = {
  video:           { label: "Video",          icon: Video,         color: "bg-red-100 text-red-700" },
  coding_exercise: { label: "Coding",         icon: Code2,         color: "bg-violet-100 text-violet-700" },
  quiz:            { label: "Quiz",           icon: ClipboardList, color: "bg-amber-100 text-amber-700" },
  reading:         { label: "Reading",        icon: BookOpen,      color: "bg-blue-100 text-blue-700" },
  soft_skill:      { label: "Soft Skill",     icon: Users,         color: "bg-emerald-100 text-emerald-700" },
  live_session:    { label: "Live Session",   icon: Radio,         color: "bg-pink-100 text-pink-700" },
};

const DIFF_COLORS: Record<string, string> = {
  beginner:     "bg-emerald-50 text-emerald-700",
  intermediate: "bg-blue-50 text-blue-700",
  advanced:     "bg-violet-50 text-violet-700",
};

const EMPTY_FORM = { title: "", description: "", module_type: "video", skill_id: "", content_url: "", duration_minutes: "", difficulty: "beginner", passing_score: "60", is_published: false };

export default function LearningModulesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ["learning-modules", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      return (await api.get(`/learning-modules?${params}`)).data.data;
    },
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: async () => (await api.get("/skills?active=true")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/learning-modules", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["learning-modules"] }); toast.success("Module created"); setShowForm(false); setForm(EMPTY_FORM); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/learning-modules/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["learning-modules"] }); toast.success("Module updated"); setEditingModule(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/learning-modules/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["learning-modules"] }); toast.success("Module deleted"); },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/learning-modules/${id}/publish`),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["learning-modules"] }); toast.success(res.data.message); },
  });

  const filtered = modules.filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.skill_name || "").toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    const body = {
      ...form,
      skill_id: form.skill_id || null,
      content_url: form.content_url || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      passing_score: parseFloat(form.passing_score) || 60,
    };
    if (editingModule) updateMutation.mutate({ id: editingModule.id, body });
    else createMutation.mutate(body);
  };

  const openEdit = (m: Module) => {
    setEditingModule(m);
    setForm({ title: m.title, description: m.description || "", module_type: m.module_type, skill_id: "", content_url: m.content_url || "", duration_minutes: String(m.duration_minutes || ""), difficulty: m.difficulty || "beginner", passing_score: String(m.passing_score || 60), is_published: m.is_published });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-black text-slate-900">Learning Modules</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">Videos, quizzes, coding exercises and reading content</p>
        </div>
        <button onClick={() => { setEditingModule(null); setForm(EMPTY_FORM); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600">
          <Plus className="h-4 w-4" /> New Module
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: modules.length, color: "text-slate-900" },
          { label: "Published", value: modules.filter(m => m.is_published).length, color: "text-emerald-600" },
          { label: "Draft", value: modules.filter(m => !m.is_published).length, color: "text-amber-600" },
          { label: "Filtered", value: filtered.length, color: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...Object.keys(TYPE_CONFIG)].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${typeFilter === t ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t === "all" ? "All Types" : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-lg font-bold text-slate-400">No modules found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Module</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Skill</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Difficulty</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Duration</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const tc = TYPE_CONFIG[m.module_type] || TYPE_CONFIG.reading;
                const Icon = tc.icon;
                return (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-900">{m.title}</p>
                      {m.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{m.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tc.color}`}>
                        <Icon className="h-3 w-3" /> {tc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.skill_name || "—"}</td>
                    <td className="px-6 py-4 text-center">
                      {m.difficulty ? <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${DIFF_COLORS[m.difficulty]}`}>{m.difficulty}</span> : "—"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{m.duration_minutes ? `${m.duration_minutes} min` : "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {m.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {m.content_url && (
                          <a href={m.content_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></a>
                        )}
                        <button onClick={() => publishMutation.mutate(m.id)} title={m.is_published ? "Unpublish" : "Publish"}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          {m.is_published ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(m)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm(`Delete "${m.title}"?`)) deleteMutation.mutate(m.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Module Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">{editingModule ? "Edit Module" : "New Module"}</h3>
              <button onClick={() => { setShowForm(false); setEditingModule(null); }}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Module title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Type *</label>
                  <select value={form.module_type} onChange={e => setForm(p => ({ ...p, module_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Module type">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Difficulty">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Linked Skill</label>
                <select value={form.skill_id} onChange={e => setForm(p => ({ ...p, skill_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Linked skill">
                  <option value="">None</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name} — {s.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Content URL</label>
                <input value={form.content_url} onChange={e => setForm(p => ({ ...p, content_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Duration (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Passing Score (%)</label>
                  <input type="number" min="0" max="100" value={form.passing_score} onChange={e => setForm(p => ({ ...p, passing_score: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} className="rounded" />
                <span className="text-sm font-bold text-slate-700">Publish immediately</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditingModule(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.title || createMutation.isPending || updateMutation.isPending}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> {editingModule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
