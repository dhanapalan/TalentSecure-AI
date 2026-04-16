// =============================================================================
// Student Development Hub
// AI Plans · Goals · Skill Progress
// =============================================================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Award,
  BarChart3,
  Clock,
  Zap,
  BookOpen,
  Code2,
  Brain,
  RefreshCw,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SkillGap {
  skill: string;
  current_level: "beginner" | "intermediate" | "advanced";
  target_level: "intermediate" | "advanced";
  priority: "high" | "medium" | "low";
}

interface RecommendedAction {
  action: string;
  resource_type: "course" | "practice" | "video" | "article";
  estimated_days: number;
  deadline_days: number;
  completed: boolean;
}

interface Milestone {
  title: string;
  target_days: number;
  description: string;
}

interface DevPlan {
  id: string;
  drive_id: string | null;
  plan_type: "post_drive" | "on_demand";
  status: "active" | "completed" | "archived";
  ai_summary: string;
  skill_gaps: SkillGap[];
  recommended_actions: RecommendedAction[];
  milestones: Milestone[];
  score_at_generation: number;
  generated_at: string;
  drive_title?: string;
}

interface Goal {
  id: string;
  title: string;
  target_role: string | null;
  target_date: string | null;
  status: "active" | "achieved" | "dropped";
  progress_percent: number;
  milestones: { title: string; done: boolean }[];
}

interface SkillProgress {
  skill_name: string;
  proficiency_score: number;
  last_assessed: string;
  assessment_source: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const RESOURCE_ICON: Record<string, typeof BookOpen> = {
  course: BookOpen,
  practice: Code2,
  video: Brain,
  article: BookOpen,
};

const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3 };

function levelProgress(current: string, target: string) {
  const c = LEVEL_ORDER[current as keyof typeof LEVEL_ORDER] || 1;
  const t = LEVEL_ORDER[target as keyof typeof LEVEL_ORDER] || 2;
  return Math.round(((c - 1) / (t - 1 || 1)) * 100);
}

// ─── AddGoalModal ─────────────────────────────────────────────────────────────

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", target_role: "", target_date: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/development/goals", form);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-goals"] });
      toast.success("Goal added!");
      onClose();
    },
    onError: () => toast.error("Failed to add goal"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Add Career Goal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Goal Title *</label>
            <input
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Get placed in a top MNC"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Target Role</label>
            <input
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Software Engineer"
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Target Date</label>
            <input
              type="date"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!form.title || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Add Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: DevPlan }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const completedActions = plan.recommended_actions.filter((a) => a.completed).length;
  const totalActions = plan.recommended_actions.length;
  const progressPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const markDone = useMutation({
    mutationFn: async (idx: number) => {
      await api.put(`/development/plans/${plan.id}/action/${idx}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-plans"] }),
    onError: () => toast.error("Failed to update"),
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {plan.drive_title || "General Development Plan"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated {new Date(plan.generated_at).toLocaleDateString()} ·{" "}
              {plan.score_at_generation}% score
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-indigo-600">{progressPct}%</p>
            <p className="text-xs text-slate-500">complete</p>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 mx-5 rounded-full">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-5 space-y-6 border-t border-slate-100 mt-2">
          {/* AI Summary */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">
              AI Summary
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{plan.ai_summary}</p>
          </div>

          {/* Skill Gaps */}
          {plan.skill_gaps.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Skill Gaps</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.skill_gaps.map((gap, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800">{gap.skill}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[gap.priority]}`}
                      >
                        {gap.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="capitalize">{gap.current_level}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="capitalize font-medium text-indigo-600">
                        {gap.target_level}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-1.5 rounded-full bg-indigo-400"
                        style={{
                          width: `${levelProgress(gap.current_level, gap.target_level)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {plan.recommended_actions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Action Plan</p>
              <div className="space-y-2">
                {plan.recommended_actions.map((action, idx) => {
                  const Icon = RESOURCE_ICON[action.resource_type] || BookOpen;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        action.completed
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <button
                        disabled={action.completed || markDone.isPending}
                        onClick={() => markDone.mutate(idx)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {action.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-indigo-500" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            action.completed ? "line-through text-slate-400" : "text-slate-700"
                          }`}
                        >
                          {action.action}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Icon className="h-3 w-3" />
                            {action.resource_type}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {action.estimated_days}d effort
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milestones */}
          {plan.milestones.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Milestones</p>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {plan.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-52 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600">
                        Day {m.target_days}
                      </span>
                      <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{m.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type DevTab = "plans" | "goals" | "skills";

export default function DevelopmentPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<DevTab>("plans");
  const [showAddGoal, setShowAddGoal] = useState(false);

  const { data: plansRes, isLoading: loadingPlans } = useQuery({
    queryKey: ["dev-plans"],
    queryFn: async () => {
      const { data } = await api.get("/development/plans");
      return data.data as DevPlan[];
    },
  });

  const { data: goalsRes, isLoading: loadingGoals } = useQuery({
    queryKey: ["dev-goals"],
    queryFn: async () => {
      const { data } = await api.get("/development/goals");
      return data.data as Goal[];
    },
  });

  const { data: skillsRes, isLoading: loadingSkills } = useQuery({
    queryKey: ["dev-skills"],
    queryFn: async () => {
      const { data } = await api.get("/development/skills");
      return data.data as { skills: SkillProgress[]; practice_scores: any[] };
    },
  });

  const generatePlan = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/development/plans/generate", {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-plans"] });
      toast.success("Development plan generated!");
    },
    onError: () => toast.error("Failed to generate plan. Please try again."),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/development/goals/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-goals"] });
      toast.success("Goal removed");
    },
  });

  const plans = plansRes || [];
  const goals = goalsRes || [];
  const skills = skillsRes?.skills || [];

  const tabs: { id: DevTab; label: string; icon: typeof Target }[] = [
    { id: "plans", label: "AI Plans", icon: Sparkles },
    { id: "goals", label: "Goals", icon: Target },
    { id: "skills", label: "Skills", icon: TrendingUp },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Development Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your AI-powered growth plan, goals, and skill progress
          </p>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={() => generatePlan.mutate()}
            disabled={generatePlan.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {generatePlan.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generatePlan.isPending ? "Generating…" : "Generate Plan"}
          </button>
        )}
        {activeTab === "goals" && (
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Plans Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          {loadingPlans ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <Sparkles className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No development plan yet
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                Generate a personalised AI plan based on your profile and assessment history
              </p>
              <button
                onClick={() => generatePlan.mutate()}
                disabled={generatePlan.isPending}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                Generate My Plan
              </button>
            </div>
          ) : (
            plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
          )}
        </div>
      )}

      {/* ── Goals Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          {loadingGoals ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No goals set</h3>
              <p className="text-sm text-slate-500 mb-6">
                Set your career goals to track your placement preparation
              </p>
              <button
                onClick={() => setShowAddGoal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Your First Goal
              </button>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                        goal.status === "achieved"
                          ? "bg-green-500"
                          : goal.status === "dropped"
                          ? "bg-slate-300"
                          : "bg-indigo-500"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{goal.title}</p>
                      {goal.target_role && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target: {goal.target_role}
                        </p>
                      )}
                      {goal.target_date && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Due: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal.mutate(goal.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {goal.progress_percent}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.status === "achieved" ? "bg-green-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${goal.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Skills Tab ───────────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          {loadingSkills ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No skill data yet
              </h3>
              <p className="text-sm text-slate-500">
                Complete assessments and practice sessions to build your skill profile
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-5">Skill Proficiency</h2>
              <div className="space-y-4">
                {skills.map((sk) => (
                  <div key={sk.skill_name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{sk.skill_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 capitalize">
                          via {sk.assessment_source}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          {sk.proficiency_score}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          sk.proficiency_score >= 70
                            ? "bg-green-500"
                            : sk.proficiency_score >= 40
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${sk.proficiency_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Topic Stats */}
          {(skillsRes?.practice_scores || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Practice Performance by Topic
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skillsRes!.practice_scores.map((ps: any) => (
                  <div
                    key={ps.skill_name}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{ps.skill_name}</p>
                      <p className="text-xs text-slate-400">{ps.sessions} sessions</p>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        Number(ps.avg_score) >= 70
                          ? "text-green-600"
                          : Number(ps.avg_score) >= 40
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {ps.avg_score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} />}
    </div>
  );
}
