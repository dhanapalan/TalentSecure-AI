import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Tag, ChevronRight, Pencil, Trash2, X, Save, BookOpen, Layers } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  skill_count: number;
}

interface Skill {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  description: string;
  level: string;
  is_active: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner:     "bg-emerald-100 text-emerald-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced:     "bg-violet-100 text-violet-700",
  expert:       "bg-rose-100 text-rose-700",
};

export default function SkillsTaxonomyPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", icon: "" });
  const [skillForm, setSkillForm] = useState({ name: "", category_id: "", description: "", level: "beginner" });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["skill-categories"],
    queryFn: async () => (await api.get("/skills/categories")).data.data,
  });

  const { data: skills = [], isLoading } = useQuery<Skill[]>({
    queryKey: ["skills", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category_id", selectedCategory);
      return (await api.get(`/skills?${params}`)).data.data;
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (body: typeof categoryForm) => api.post("/skills/categories", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-categories"] }); toast.success("Category created"); setShowCategoryForm(false); setCategoryForm({ name: "", description: "", icon: "" }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<typeof categoryForm> }) => api.put(`/skills/categories/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-categories"] }); toast.success("Category updated"); setEditingCategory(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/skills/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-categories"] }); toast.success("Category deleted"); },
    onError: () => toast.error("Cannot delete — skills exist in this category"),
  });

  const createSkillMutation = useMutation({
    mutationFn: (body: typeof skillForm) => api.post("/skills", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skills"] }); toast.success("Skill created"); setShowSkillForm(false); setSkillForm({ name: "", category_id: "", description: "", level: "beginner" }); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/skills/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skills"] }); toast.success("Skill updated"); setEditingSkill(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/skills/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skills"] }); toast.success("Skill deleted"); },
  });

  const toggleSkillMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.put(`/skills/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });

  const filtered = skills.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Layers className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-black text-slate-900">Skills Taxonomy</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">Manage skill categories and individual skills</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
            <Plus className="h-4 w-4" /> New Category
          </button>
          <button onClick={() => setShowSkillForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600">
            <Plus className="h-4 w-4" /> New Skill
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Categories</p>
          <p className="text-3xl font-black text-indigo-600 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Skills</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{skills.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Skills</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{skills.filter(s => s.is_active).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtered</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{filtered.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</h3>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${selectedCategory === "all" ? "bg-indigo-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"}`}
          >
            <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> All Skills</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${selectedCategory === "all" ? "bg-indigo-400" : "bg-slate-100"}`}>{skills.length}</span>
          </button>
          {categories.map(cat => (
            <div key={cat.id} className={`group rounded-xl border transition-all ${selectedCategory === cat.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <button onClick={() => setSelectedCategory(cat.id)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left">
                <span className={selectedCategory === cat.id ? "text-indigo-700" : "text-slate-700"}>{cat.name}</span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${selectedCategory === cat.id ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>{cat.skill_count}</span>
              </button>
              <div className="hidden group-hover:flex items-center gap-1 px-4 pb-2">
                <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "" }); }} className="p-1 rounded text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCategoryMutation.mutate(cat.id); }} className="p-1 rounded text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Skills Main Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm" />
          </div>

          {/* Skills List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-400">No skills found</p>
                <p className="text-xs text-slate-400 mt-1">Create a skill to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Skill</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Level</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(skill => (
                    <tr key={skill.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/app/skills/${skill.id}`} className="font-bold text-sm text-slate-900 hover:text-indigo-600">{skill.name}</Link>
                        {skill.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{skill.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{skill.category_name || "—"}</td>
                      <td className="px-6 py-4 text-center">
                        {skill.level ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${LEVEL_COLORS[skill.level] || "bg-slate-100 text-slate-600"}`}>{skill.level}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleSkillMutation.mutate({ id: skill.id, is_active: !skill.is_active })}
                          className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${skill.is_active ? "bg-emerald-500" : "bg-slate-200"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${skill.is_active ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/app/skills/${skill.id}`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><ChevronRight className="h-4 w-4" /></Link>
                          <button onClick={() => { setEditingSkill(skill); setSkillForm({ name: skill.name, category_id: skill.category_id || "", description: skill.description || "", level: skill.level || "beginner" }); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm(`Delete "${skill.name}"?`)) deleteSkillMutation.mutate(skill.id); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {(showCategoryForm || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">{editingCategory ? "Edit Category" : "New Category"}</h3>
              <button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name *</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Programming" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                <textarea rows={2} value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Brief description..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Icon (lucide name)</label>
                <input value={categoryForm.icon} onChange={e => setCategoryForm(p => ({ ...p, icon: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. code" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => editingCategory ? updateCategoryMutation.mutate({ id: editingCategory.id, body: categoryForm }) : createCategoryMutation.mutate(categoryForm)}
                disabled={!categoryForm.name}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Form Modal */}
      {(showSkillForm || editingSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">{editingSkill ? "Edit Skill" : "New Skill"}</h3>
              <button onClick={() => { setShowSkillForm(false); setEditingSkill(null); }}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Skill Name *</label>
                <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Python Programming" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Category *</label>
                <select value={skillForm.category_id} onChange={e => setSkillForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Category">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Level</label>
                <select value={skillForm.level} onChange={e => setSkillForm(p => ({ ...p, level: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Level">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                <textarea rows={2} value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowSkillForm(false); setEditingSkill(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => editingSkill ? updateSkillMutation.mutate({ id: editingSkill.id, body: skillForm }) : createSkillMutation.mutate(skillForm)}
                disabled={!skillForm.name || !skillForm.category_id}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> {editingSkill ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
