// =============================================================================
// GradLogic — Mentor Dashboard (Phase 3)
// Assigned Students · Session Logging · Feedback · Progress View
// =============================================================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

// =============================================================================
// TYPES
// =============================================================================
interface AssignedStudent {
  id: string; name: string; email: string;
  degree: string; passing_year: number; college_name: string;
  total_xp: number; level: number; current_streak: number;
  readiness_score: number; last_session_date: string | null;
  session_count: number; assignment_notes: string | null;
}

interface Session {
  id: string; student_id: string; student_name: string; degree: string;
  session_type: string; duration_mins: number; notes: string | null;
  feedback: string | null; action_items: any[]; session_date: string;
}

interface StudentDetail {
  profile: any;
  recent_sessions: Session[];
  drive_history: any[];
  practice: any;
  goals: any[];
  badges: any[];
}

// =============================================================================
// READINESS BADGE
// =============================================================================
function ReadinessBadge({ score }: { score: number }) {
  const s = Number(score) || 0;
  const cls = s >= 75 ? "bg-green-100 text-green-700" : s >= 50 ? "bg-yellow-100 text-yellow-700" : s >= 25 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700";
  const label = s >= 75 ? "Ready" : s >= 50 ? "On Track" : s >= 25 ? "Needs Work" : "At Risk";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label} ({s.toFixed(0)})</span>;
}

// =============================================================================
// SESSION FORM
// =============================================================================
function SessionForm({
  studentId, studentName, onSuccess, onCancel,
}: {
  studentId: string; studentName: string; onSuccess: () => void; onCancel: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    session_type: "one_on_one",
    duration_mins: 30,
    notes: "",
    feedback: "",
    session_date: new Date().toISOString().slice(0, 10),
    action_items: [] as { task: string; due_date: string; done: boolean }[],
  });
  const [newAction, setNewAction] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/mentor/sessions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor-sessions"] });
      qc.invalidateQueries({ queryKey: ["mentor-students"] });
      onSuccess();
    },
  });

  const addAction = () => {
    if (!newAction.trim()) return;
    setForm(f => ({ ...f, action_items: [...f.action_items, { task: newAction.trim(), due_date: "", done: false }] }));
    setNewAction("");
  };

  const removeAction = (i: number) =>
    setForm(f => ({ ...f, action_items: f.action_items.filter((_, j) => j !== i) }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Log Session with {studentName}</h3>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Session Type</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}>
            <option value="one_on_one">1:1 Session</option>
            <option value="group">Group</option>
            <option value="async">Async / Written</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Duration (mins)</label>
          <input type="number" min={5} max={180} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: parseInt(e.target.value) || 30 }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Private Notes (not shared with student)</label>
        <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="What was discussed, observations..."
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Feedback (shared with student via notification)</label>
        <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Strengths, areas to improve, encouragement..."
          value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Action Items</label>
        <div className="flex gap-2 mb-2">
          <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Add action item..." value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAction())} />
          <button onClick={addAction} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Add</button>
        </div>
        {form.action_items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-sm text-gray-700">
            <span className="text-gray-400">•</span>
            <span className="flex-1">{item.task}</span>
            <button onClick={() => removeAction(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={() => mutation.mutate({ student_id: studentId, ...form })}
          disabled={mutation.isPending}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {mutation.isPending ? "Saving..." : "Log Session"}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// STUDENT DETAIL PANEL
// =============================================================================
function StudentDetailPanel({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const [showSessionForm, setShowSessionForm] = useState(false);

  const { data, isLoading } = useQuery<StudentDetail>({
    queryKey: ["mentor-student-detail", studentId],
    queryFn: () => api.get(`/mentor/students/${studentId}`).then(r => r.data.data),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!data) return null;

  const { profile, recent_sessions, drive_history, practice, goals, badges } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">← Back to students</button>
        <button onClick={() => setShowSessionForm(s => !s)}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          {showSessionForm ? "Cancel" : "+ Log Session"}
        </button>
      </div>

      {showSessionForm && (
        <SessionForm studentId={studentId} studentName={profile?.name}
          onSuccess={() => setShowSessionForm(false)} onCancel={() => setShowSessionForm(false)} />
      )}

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
            {profile?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.degree} · {profile?.passing_year} · {profile?.college_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Level", value: `Lv ${profile?.level}`, color: "text-purple-600" },
            { label: "Total XP", value: (profile?.total_xp || 0).toLocaleString(), color: "text-indigo-600" },
            { label: "Streak", value: `${profile?.current_streak}d`, color: "text-orange-600" },
            { label: "Practice", value: practice?.completed_sessions ?? 0, color: "text-blue-600" },
            { label: "Best Score", value: practice?.best_score ? `${practice.best_score}%` : "—", color: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Drive history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-3 text-sm">Drive History</h3>
          {drive_history.length === 0 ? (
            <p className="text-xs text-gray-400">No drives taken yet.</p>
          ) : (
            <div className="space-y-2">
              {drive_history.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 truncate">{d.drive_name}</p>
                    <p className="text-xs text-gray-400">{new Date(d.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`font-semibold ${Number(d.score) >= 60 ? "text-green-600" : "text-red-500"}`}>{d.score ?? "—"}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-3 text-sm">Goals</h3>
          {goals.length === 0 ? (
            <p className="text-xs text-gray-400">No goals set yet.</p>
          ) : (
            <div className="space-y-2">
              {goals.map((g: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate flex-1">{g.title}</span>
                    <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full ${g.status === "achieved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{g.status}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${g.progress_percent || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-3 text-sm">Recent Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <div key={b.slug} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs font-medium text-gray-700">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-medium text-gray-700 mb-3 text-sm">Session History</h3>
        {recent_sessions.length === 0 ? (
          <p className="text-xs text-gray-400">No sessions logged yet. Click "+ Log Session" above.</p>
        ) : (
          <div className="space-y-3">
            {recent_sessions.map(s => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{s.session_type.replace("_", " ")} · {s.duration_mins}min</span>
                  <span className="text-xs text-gray-400">{new Date(s.session_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {s.feedback && <p className="text-xs text-gray-600 mt-1 bg-blue-50 rounded-lg p-2">{s.feedback}</p>}
                {s.action_items?.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {s.action_items.map((a: any, i: number) => (
                      <p key={i} className={`text-xs flex items-start gap-1 ${a.done ? "line-through text-gray-400" : "text-gray-600"}`}>
                        <span>{a.done ? "✓" : "•"}</span>{a.task}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN MENTOR DASHBOARD
// =============================================================================

export default function MentorDashboardPage() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery<AssignedStudent[]>({
    queryKey: ["mentor-students"],
    queryFn: () => api.get("/mentor/students").then(r => r.data.data),
  });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.degree?.toLowerCase().includes(search.toLowerCase()) ||
    s.college_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedStudent) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <StudentDetailPanel studentId={selectedStudent} onBack={() => setSelectedStudent(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your assigned students and session log</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{students.length}</div>
          <div className="text-xs text-gray-500">Assigned Students</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {students.filter(s => Number(s.readiness_score) >= 75).length}
          </div>
          <div className="text-xs text-gray-500">Ready for Placement</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-500">
            {students.filter(s => Number(s.readiness_score) < 25).length}
          </div>
          <div className="text-xs text-gray-500">At Risk</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {students.reduce((sum, s) => sum + (s.session_count || 0), 0)}
          </div>
          <div className="text-xs text-gray-500">Total Sessions</div>
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm shadow-sm"
        placeholder="Search students by name, degree or college..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 cursor-pointer transition-colors"
              onClick={() => setSelectedStudent(s.id)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-base flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <ReadinessBadge score={s.readiness_score} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.degree} · {s.passing_year} · {s.college_name}</p>

                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Lv {s.level} · {(s.total_xp || 0).toLocaleString()} XP</span>
                    {s.current_streak > 0 && <span>🔥 {s.current_streak}d streak</span>}
                    <span>{s.session_count} session{s.session_count !== 1 ? "s" : ""}</span>
                    {s.last_session_date && (
                      <span>Last: {new Date(s.last_session_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {students.length === 0 ? "No students assigned yet. Contact your admin." : "No students match your search."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
