import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, GraduationCap, BookOpen, Users, Clock, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface Program {
  id: string;
  name: string;
  description: string;
  program_type: string;
  duration_days: number | null;
  is_active: boolean;
  college_name: string | null;
  module_count: number;
  enrollment_count: number;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  learning_path:  { label: "Learning Path",  color: "bg-blue-100 text-blue-700" },
  bootcamp:       { label: "Bootcamp",       color: "bg-violet-100 text-violet-700" },
  workshop:       { label: "Workshop",       color: "bg-amber-100 text-amber-700" },
  certification:  { label: "Certification", color: "bg-emerald-100 text-emerald-700" },
};

export default function SkillProgramsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["skill-programs", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      return (await api.get(`/skill-programs?${params}`)).data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/skill-programs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-programs"] }); toast.success("Program deleted"); },
    onError: () => toast.error("Failed to delete program"),
  });

  const filtered = programs.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = programs.filter(p => p.is_active).length;
  const totalEnrollments = programs.reduce((acc, p) => acc + (p.enrollment_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-black text-slate-900">Skill Programs</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">Learning paths, bootcamps, workshops and certifications</p>
        </div>
        <button onClick={() => navigate("/app/skill-programs/new")}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600">
          <Plus className="h-4 w-4" /> New Program
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Programs", value: programs.length, color: "text-slate-900" },
          { label: "Active", value: activeCount, color: "text-emerald-600" },
          { label: "Total Enrollments", value: totalEnrollments, color: "text-indigo-600" },
          { label: "Filtered", value: filtered.length, color: "text-slate-900" },
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
          <input type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)}
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

      {/* Program Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <GraduationCap className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-lg font-bold text-slate-400">No programs found</p>
          <p className="text-sm text-slate-400 mt-1">Create a program to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(program => {
            const tc = TYPE_CONFIG[program.program_type] || TYPE_CONFIG.learning_path;
            return (
              <div key={program.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tc.color}`}>{tc.label}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/app/skill-programs/${program.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /></Link>
                      <button onClick={() => { if (confirm(`Delete "${program.name}"?`)) deleteMutation.mutate(program.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{program.name}</h3>
                  {program.college_name && <p className="text-xs font-bold text-indigo-500 mb-2">🏛 {program.college_name}</p>}
                  {program.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{program.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {program.module_count} modules</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {program.enrollment_count} enrolled</span>
                    {program.duration_days && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {program.duration_days}d</span>}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between">
                  <span className={`text-xs font-bold ${program.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                    {program.is_active ? "● Active" : "○ Inactive"}
                  </span>
                  <Link to={`/app/skill-programs/${program.id}`} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
