import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import {
  Users, Search, Filter, ExternalLink, ChevronDown,
  Star, Calendar, Gift, X, FileText, Linkedin,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Drive { id: string; name: string }

interface Candidate {
  drive_student_id: string;
  student_id: string;
  drive_id: string;
  drive_name: string;
  score: number | null;
  pipeline_stage: PipelineStage;
  completed_at: string | null;
  student_name: string;
  student_email: string;
  degree: string | null;
  specialization: string | null;
  passing_year: number | null;
  cgpa: number | null;
  skills: string[];
  linkedin_url: string | null;
  resume_url: string | null;
  college_name: string | null;
}

type PipelineStage = "pending" | "shortlisted" | "interview_scheduled" | "offered" | "rejected";

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES: { value: PipelineStage | "all"; label: string; color: string }[] = [
  { value: "all",                  label: "All",               color: "bg-slate-100 text-slate-600" },
  { value: "pending",              label: "Under Review",      color: "bg-slate-100 text-slate-500" },
  { value: "shortlisted",          label: "Shortlisted",       color: "bg-amber-100 text-amber-700" },
  { value: "interview_scheduled",  label: "Interview Set",     color: "bg-blue-100 text-blue-700"   },
  { value: "offered",              label: "Offered",           color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected",             label: "Rejected",          color: "bg-rose-100 text-rose-500"   },
];

const NEXT_ACTIONS: Record<PipelineStage, { label: string; stage: PipelineStage; icon: typeof Star; color: string }[]> = {
  pending:             [{ label: "Shortlist",        stage: "shortlisted",         icon: Star,     color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" },
                        { label: "Reject",           stage: "rejected",            icon: X,        color: "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"   }],
  shortlisted:         [{ label: "Schedule Interview", stage: "interview_scheduled", icon: Calendar, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"   },
                        { label: "Reject",           stage: "rejected",            icon: X,        color: "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"   }],
  interview_scheduled: [{ label: "Release Offer",   stage: "offered",             icon: Gift,     color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
                        { label: "Reject",           stage: "rejected",            icon: X,        color: "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"   }],
  offered:             [],
  rejected:            [],
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  const cfg = STAGES.find(s => s.value === stage) ?? STAGES[0];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-slate-300 text-xs">—</span>;
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-500" : "text-rose-500";
  return <span className={`font-black text-sm ${color}`}>{score.toFixed(1)}%</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CompanyCandidatesPage() {
  const queryClient = useQueryClient();
  const [selectedDrive, setSelectedDrive] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fetch drives for filter dropdown
  const { data: drivesData } = useQuery({
    queryKey: ["company-drives"],
    queryFn: () => api.get("/company/drives").then(r => r.data.data as Drive[]),
  });

  // Fetch candidates
  const params = new URLSearchParams();
  if (selectedDrive !== "all") params.set("drive_id", selectedDrive);
  if (selectedStage !== "all") params.set("stage", selectedStage);
  if (minScore) params.set("min_score", minScore);

  const { data, isLoading } = useQuery({
    queryKey: ["company-candidates", selectedDrive, selectedStage, minScore],
    queryFn: () => api.get(`/company/candidates?${params}`).then(r => r.data),
  });

  const candidates: Candidate[] = (data?.data ?? []).filter((c: Candidate) =>
    !search || c.student_name.toLowerCase().includes(search.toLowerCase()) ||
    c.student_email.toLowerCase().includes(search.toLowerCase()) ||
    (c.college_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Stage update mutation
  const stageMutation = useMutation({
    mutationFn: ({ dsId, stage }: { dsId: string; stage: PipelineStage }) =>
      api.put(`/company/candidates/${dsId}/stage`, { stage }),
    onSuccess: (_, { dsId, stage }) => {
      const label = STAGES.find(s => s.value === stage)?.label ?? stage;
      toast.success(`Moved to ${label}`);
      queryClient.setQueryData(
        ["company-candidates", selectedDrive, selectedStage, minScore],
        (old: any) => old
          ? { ...old, data: old.data.map((c: Candidate) =>
              c.drive_student_id === dsId ? { ...c, pipeline_stage: stage } : c
            )}
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["company-stats"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update stage"),
  });

  const drives = drivesData ?? [];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">Candidates</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {data?.total != null ? `${data.total} candidates` : "Loading…"} across your drives
        </p>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map(s => (
          <button
            key={s.value}
            onClick={() => setSelectedStage(s.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              selectedStage === s.value
                ? `${s.color} border-current shadow-sm`
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, college…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            value={selectedDrive}
            onChange={e => setSelectedDrive(e.target.value)}
            className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
          >
            <option value="all">All drives</option>
            {drives.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3">
          <span className="text-xs text-slate-400 whitespace-nowrap">Min score</span>
          <input
            type="number"
            min={0} max={100}
            value={minScore}
            onChange={e => setMinScore(e.target.value)}
            placeholder="0"
            className="w-14 py-2 text-sm focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Candidate list */}
      {isLoading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading candidates…</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No candidates found</p>
          <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map(c => {
            const isExpanded = expanded === c.drive_student_id;
            const actions = NEXT_ACTIONS[c.pipeline_stage] ?? [];

            return (
              <div key={c.drive_student_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.drive_student_id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                    {c.student_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + college */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.student_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {c.college_name ?? c.student_email} · {c.drive_name}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 w-16 text-right">
                    <ScoreBar score={c.score} />
                  </div>

                  {/* Stage */}
                  <div className="shrink-0">
                    <StageBadge stage={c.pipeline_stage} />
                  </div>

                  <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-4">
                    {/* Profile info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: "Degree",      value: [c.degree, c.specialization].filter(Boolean).join(" — ") || "—" },
                        { label: "Passing Year",value: c.passing_year ?? "—" },
                        { label: "CGPA",        value: c.cgpa ?? "—" },
                        { label: "Email",       value: c.student_email },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-slate-400 font-semibold mb-0.5">{label}</p>
                          <p className="text-slate-700 font-bold truncate">{String(value)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Skills */}
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.skills.slice(0, 10).map(s => (
                          <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Links + actions row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold">
                            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                          </a>
                        )}
                        {c.resume_url && (
                          <a href={c.resume_url} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-xs text-slate-600 hover:underline font-semibold">
                            <FileText className="h-3.5 w-3.5" /> Resume
                          </a>
                        )}
                        <a href={`/app/students/${c.student_id}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold">
                          <ExternalLink className="h-3.5 w-3.5" /> Full Profile
                        </a>
                      </div>

                      {/* Pipeline action buttons */}
                      <div className="flex items-center gap-2">
                        {actions.map(action => {
                          const Icon = action.icon;
                          const isLoading = stageMutation.isPending &&
                            stageMutation.variables?.dsId === c.drive_student_id &&
                            stageMutation.variables?.stage === action.stage;
                          return (
                            <button
                              key={action.stage}
                              onClick={() => stageMutation.mutate({ dsId: c.drive_student_id, stage: action.stage })}
                              disabled={stageMutation.isPending}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${action.color}`}
                            >
                              {isLoading
                                ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <Icon className="h-3.5 w-3.5" />}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
