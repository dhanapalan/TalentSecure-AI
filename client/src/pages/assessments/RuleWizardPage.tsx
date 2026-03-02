import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Save,
    RocketIcon,
    Settings,
    Brain,
    BarChart3,
    Database,
    Target,
    FileCheck,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface RuleFormData {
    // Step 1 — Basic
    name: string;
    description: string;
    target_role: string;
    duration_minutes: number;
    total_questions: number;
    total_marks: number;
    negative_marking_enabled: boolean;
    negative_marking_value: number;
    overall_cutoff: number;
    // Step 2 — Skills
    skill_distribution: Record<string, number>;
    // Step 3 — Difficulty
    difficulty_distribution: Record<string, number>;
    // Step 4 — Pool
    pool_generation_config: {
        volume_multiplier: number;
        ai_model: string;
        language: string;
        regeneration_allowed: boolean;
    };
    // Step 5 — Proctoring
    proctoring_mode: string;
    proctoring_config: {
        max_tab_switches: number;
        face_detection_mandatory: boolean;
        auto_terminate_threshold: number;
        network_anomaly_tolerance: number;
    };
    // Step 6 — Targeting
    targeting_config: {
        assign_to: string;
        attempt_limit: number;
        auto_publish_results: boolean;
        allow_mock: boolean;
    };
    // Meta
    status: string;
}

const defaultSkills: Record<string, number> = {
    Aptitude: 30,
    Reasoning: 20,
    "Data Structures": 25,
    Programming: 15,
    SQL: 10,
};

const defaultDifficulty: Record<string, number> = {
    Easy: 30,
    Medium: 50,
    Hard: 20,
};

const initialForm: RuleFormData = {
    name: "",
    description: "",
    target_role: "",
    duration_minutes: 60,
    total_questions: 30,
    total_marks: 100,
    negative_marking_enabled: false,
    negative_marking_value: 0.25,
    overall_cutoff: 40,
    skill_distribution: { ...defaultSkills },
    difficulty_distribution: { ...defaultDifficulty },
    pool_generation_config: {
        volume_multiplier: 10,
        ai_model: "gpt-4o",
        language: "English",
        regeneration_allowed: true,
    },
    proctoring_mode: "moderate",
    proctoring_config: {
        max_tab_switches: 3,
        face_detection_mandatory: true,
        auto_terminate_threshold: 5,
        network_anomaly_tolerance: 3,
    },
    targeting_config: {
        assign_to: "all",
        attempt_limit: 1,
        auto_publish_results: false,
        allow_mock: true,
    },
    status: "draft",
};

const STEPS = [
    { key: "basic", label: "Basic Config", icon: Settings },
    { key: "skills", label: "Skill Distribution", icon: Brain },
    { key: "difficulty", label: "Difficulty", icon: BarChart3 },
    { key: "pool", label: "Pool Config", icon: Database },
    { key: "targeting", label: "Targeting", icon: Target },
    { key: "review", label: "Review & Save", icon: FileCheck },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function RuleWizardPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id && id !== "new";

    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState<RuleFormData>({ ...initialForm });
    const [saving, setSaving] = useState(false);

    // Fetch existing rule if editing
    const { data: existingRule } = useQuery({
        queryKey: ["assessment-rule", id],
        queryFn: async () => {
            if (!isEdit) return null;
            const res = await api.get(`/assessment-rules/${id}`);
            return res.data.data;
        },
        enabled: isEdit,
    });

    useEffect(() => {
        if (existingRule) {
            setForm({
                name: existingRule.name || "",
                description: existingRule.description || "",
                target_role: existingRule.target_role || "",
                duration_minutes: existingRule.duration_minutes || 60,
                total_questions: existingRule.total_questions || 30,
                total_marks: existingRule.total_marks || 100,
                negative_marking_enabled: existingRule.negative_marking_enabled || false,
                negative_marking_value: existingRule.negative_marking_value || 0.25,
                overall_cutoff: existingRule.overall_cutoff || 40,
                skill_distribution: existingRule.skill_distribution || { ...defaultSkills },
                difficulty_distribution: existingRule.difficulty_distribution || { ...defaultDifficulty },
                pool_generation_config: existingRule.pool_generation_config || initialForm.pool_generation_config,
                proctoring_mode: existingRule.proctoring_mode || "moderate",
                proctoring_config: existingRule.proctoring_config || initialForm.proctoring_config,
                targeting_config: existingRule.targeting_config || initialForm.targeting_config,
                status: existingRule.status || "draft",
            });
        }
    }, [existingRule]);

    const updateField = <K extends keyof RuleFormData>(key: K, value: RuleFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const skillTotal = Object.values(form.skill_distribution).reduce((a, b) => a + b, 0);
    const diffTotal = Object.values(form.difficulty_distribution).reduce((a, b) => a + b, 0);

    const handleSave = async (status: string) => {
        if (!form.name.trim()) { toast.error("Rule name is required"); setCurrentStep(0); return; }
        if (skillTotal !== 100) { toast.error("Skill distribution must total 100%"); setCurrentStep(1); return; }
        if (diffTotal !== 100) { toast.error("Difficulty distribution must total 100%"); setCurrentStep(2); return; }

        setSaving(true);
        try {
            const payload = { ...form, status };
            if (isEdit) {
                await api.put(`/assessment-rules/${id}`, payload);
                toast.success("Rule updated");
            } else {
                await api.post("/assessment-rules", payload);
                toast.success("Rule created");
            }
            navigate("/app/assessment-rules");
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateLaunch = async () => {
        await handleSave("active_template");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate("/app/assessment-rules")} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{isEdit ? "Edit Rule" : "Create Assessment Rule"}</h1>
                    <p className="text-sm text-slate-500">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto">
                    {STEPS.map((step, i) => (
                        <button
                            key={step.key}
                            onClick={() => setCurrentStep(i)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${i === currentStep
                                ? "bg-amber-500 text-white shadow-sm"
                                : i < currentStep
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-50 text-slate-400"
                                }`}
                        >
                            <step.icon className="h-4 w-4" />
                            {step.label}
                            {i < currentStep && <Check className="h-3 w-3 ml-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-6">
                {currentStep === 0 && (
                    <StepBasic form={form} updateField={updateField} />
                )}
                {currentStep === 1 && (
                    <StepSkills form={form} updateField={updateField} total={skillTotal} />
                )}
                {currentStep === 2 && (
                    <StepDifficulty form={form} updateField={updateField} total={diffTotal} />
                )}
                {currentStep === 3 && (
                    <StepPool form={form} updateField={updateField} />
                )}
                {currentStep === 4 && (
                    <StepTargeting form={form} updateField={updateField} />
                )}
                {currentStep === 5 && (
                    <StepReview form={form} skillTotal={skillTotal} diffTotal={diffTotal} />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-200 transition-all"
                >
                    <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <div className="flex gap-3">
                    {currentStep === STEPS.length - 1 ? (
                        <>
                            <button
                                onClick={() => handleSave("draft")}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
                            >
                                <Save className="h-4 w-4" /> Save as Draft
                            </button>
                            <button
                                onClick={() => handleSave("active_template")}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-sm font-bold text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                            >
                                <Check className="h-4 w-4" /> Save & Activate
                            </button>
                            <button
                                onClick={handleGenerateLaunch}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-sm font-bold text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                            >
                                <RocketIcon className="h-4 w-4" /> Generate & Launch Drive
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-sm font-bold text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                        >
                            Next <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Step Components ──────────────────────────────────────────────────────────

function StepBasic({ form, updateField }: { form: RuleFormData; updateField: any }) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-500" /> Basic Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Rule Name *</label>
                    <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g., Full Stack Developer Assessment" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Detailed description of this assessment rule..." rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Target Role (Optional)</label>
                    <input value={form.target_role} onChange={(e) => updateField("target_role", e.target.value)} placeholder="e.g., Frontend Developer" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Exam Duration (minutes)</label>
                    <input type="number" value={form.duration_minutes} onChange={(e) => updateField("duration_minutes", Number(e.target.value))} min={5} max={300} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Questions</label>
                    <input type="number" value={form.total_questions} onChange={(e) => updateField("total_questions", Number(e.target.value))} min={1} max={500} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Marks</label>
                    <input type="number" value={form.total_marks} onChange={(e) => updateField("total_marks", Number(e.target.value))} min={1} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Overall Cutoff (%)</label>
                    <input type="number" value={form.overall_cutoff} onChange={(e) => updateField("overall_cutoff", Number(e.target.value))} min={0} max={100} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex items-center gap-4 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.negative_marking_enabled} onChange={(e) => updateField("negative_marking_enabled", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm font-bold text-slate-700">Enable Negative Marking</span>
                    </label>
                    {form.negative_marking_enabled && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Deduction per wrong answer:</span>
                            <input type="number" value={form.negative_marking_value} onChange={(e) => updateField("negative_marking_value", Number(e.target.value))} step={0.25} min={0} max={5} className="w-20 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepSkills({ form, updateField, total }: { form: RuleFormData; updateField: any; total: number }) {
    const updateSkill = (key: string, val: number) => {
        updateField("skill_distribution", { ...form.skill_distribution, [key]: val });
    };
    const addSkill = () => {
        const name = prompt("Enter skill name:");
        if (name && !form.skill_distribution[name]) {
            updateField("skill_distribution", { ...form.skill_distribution, [name]: 0 });
        }
    };
    const removeSkill = (key: string) => {
        const next = { ...form.skill_distribution };
        delete next[key];
        updateField("skill_distribution", next);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-amber-500" /> Skill Distribution
                </h2>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${total === 100 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    Total: {total}% {total === 100 ? "✓" : "(must be 100%)"}
                </div>
            </div>

            <div className="space-y-4">
                {Object.entries(form.skill_distribution).map(([skill, pct]) => (
                    <div key={skill} className="flex items-center gap-4">
                        <span className="w-40 text-sm font-bold text-slate-700 truncate">{skill}</span>
                        <input
                            type="range"
                            min={0} max={100} value={pct}
                            onChange={(e) => updateSkill(skill, Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-full appearance-none accent-amber-500"
                        />
                        <input
                            type="number"
                            value={pct}
                            onChange={(e) => updateSkill(skill, Number(e.target.value))}
                            min={0} max={100}
                            className="w-20 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-center font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-sm text-slate-400">%</span>
                        <button onClick={() => removeSkill(skill)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                    </div>
                ))}
            </div>

            <button onClick={addSkill} className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">
                + Add Skill
            </button>
        </div>
    );
}

function StepDifficulty({ form, updateField, total }: { form: RuleFormData; updateField: any; total: number }) {
    const updateDiff = (key: string, val: number) => {
        updateField("difficulty_distribution", { ...form.difficulty_distribution, [key]: val });
    };

    const colors: Record<string, string> = { Easy: "text-emerald-600", Medium: "text-amber-600", Hard: "text-red-600" };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-amber-500" /> Difficulty Distribution
                </h2>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${total === 100 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    Total: {total}% {total === 100 ? "✓" : "(must be 100%)"}
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(form.difficulty_distribution).map(([level, pct]) => (
                    <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${colors[level] || "text-slate-700"}`}>{level}</span>
                            <span className="text-sm font-bold text-slate-700">{pct}%</span>
                        </div>
                        <input
                            type="range"
                            min={0} max={100} value={pct}
                            onChange={(e) => updateDiff(level, Number(e.target.value))}
                            className="w-full h-3 bg-slate-200 rounded-full appearance-none accent-amber-500"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepPool({ form, updateField }: { form: RuleFormData; updateField: any }) {
    const cfg = form.pool_generation_config;
    const updateCfg = (key: string, val: any) => {
        updateField("pool_generation_config", { ...cfg, [key]: val });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-500" /> Pool Generation Config
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Volume Multiplier (e.g., 10× actual need)</label>
                    <input type="number" value={cfg.volume_multiplier} onChange={(e) => updateCfg("volume_multiplier", Number(e.target.value))} min={1} max={50} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">AI Model Version</label>
                    <select value={cfg.ai_model} onChange={(e) => updateCfg("ai_model", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-3.5">Claude 3.5</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Language</label>
                    <select value={cfg.language} onChange={(e) => updateCfg("language", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Tamil</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.regeneration_allowed} onChange={(e) => updateCfg("regeneration_allowed", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm font-bold text-slate-700">Allow Regeneration</span>
                    </label>
                </div>
            </div>
        </div>
    );
}


function StepTargeting({ form, updateField }: { form: RuleFormData; updateField: any }) {
    const cfg = form.targeting_config;
    const updateCfg = (key: string, val: any) => {
        updateField("targeting_config", { ...cfg, [key]: val });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" /> Targeting & Assignment Template
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Assign To</label>
                    <select value={cfg.assign_to} onChange={(e) => updateCfg("assign_to", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                        <option value="all">All Eligible Students</option>
                        <option value="campus">By Campus</option>
                        <option value="segment">By Segment</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Attempt Limit</label>
                    <input type="number" value={cfg.attempt_limit} onChange={(e) => updateCfg("attempt_limit", Number(e.target.value))} min={1} max={10} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.auto_publish_results} onChange={(e) => updateCfg("auto_publish_results", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm font-bold text-slate-700">Auto Publish Results</span>
                    </label>
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.allow_mock} onChange={(e) => updateCfg("allow_mock", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm font-bold text-slate-700">Allow Mock Exam</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

function StepReview({ form, skillTotal, diffTotal }: { form: RuleFormData; skillTotal: number; diffTotal: number }) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-amber-500" /> Review & Save
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Basic Configuration</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Name:</span> <span className="font-bold text-slate-800">{form.name || "—"}</span></p>
                        <p><span className="text-slate-400">Duration:</span> <span className="font-bold">{form.duration_minutes} min</span></p>
                        <p><span className="text-slate-400">Questions:</span> <span className="font-bold">{form.total_questions}</span></p>
                        <p><span className="text-slate-400">Total Marks:</span> <span className="font-bold">{form.total_marks}</span></p>
                        <p><span className="text-slate-400">Cutoff:</span> <span className="font-bold">{form.overall_cutoff}%</span></p>
                        <p><span className="text-slate-400">Negative Marking:</span> <span className="font-bold">{form.negative_marking_enabled ? `Yes (−${form.negative_marking_value})` : "No"}</span></p>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">
                        Skill Distribution <span className={skillTotal === 100 ? "text-emerald-600" : "text-red-600"}>({skillTotal}%)</span>
                    </h3>
                    <div className="space-y-1.5">
                        {Object.entries(form.skill_distribution).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                                <div className="w-28 text-xs text-slate-600 truncate">{k}</div>
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-amber-500 rounded-full h-2" style={{ width: `${v}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 w-8 text-right">{v}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">
                        Difficulty <span className={diffTotal === 100 ? "text-emerald-600" : "text-red-600"}>({diffTotal}%)</span>
                    </h3>
                    <div className="space-y-1.5">
                        {Object.entries(form.difficulty_distribution).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                                <div className="w-16 text-xs text-slate-600">{k}</div>
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className={`rounded-full h-2 ${k === "Easy" ? "bg-emerald-500" : k === "Medium" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${v}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 w-8 text-right">{v}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
