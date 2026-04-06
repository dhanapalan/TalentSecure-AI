import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Calendar, Rocket, ClipboardList, Loader2, Clock, RefreshCw, Shield, User, ArrowLeft } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface Rule {
    id: string;
    name: string;
    version: number;
    duration_minutes?: number;
    total_questions?: number;
    proctoring_mode?: string;
    attempt_limit?: number;
}

export default function CreateDrivePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialRuleId = searchParams.get("rule_id");

    const [rules, setRules] = useState<Rule[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        rule_id: initialRuleId || "",
        duration_minutes: "",
        attempt_limit: "1",
        proctoring_mode: "standard",
        scheduled_start: "",
        scheduled_end: "",
        max_applicants: "500",
    });

    const selectedRule = rules.find(r => r.id === formData.rule_id);

    useEffect(() => {
        if (selectedRule) {
            setFormData(prev => ({
                ...prev,
                duration_minutes: String(selectedRule.duration_minutes || 60),
                proctoring_mode: selectedRule.proctoring_mode || "standard",
                attempt_limit: String(selectedRule.attempt_limit || 1),
            }));
        }
    }, [selectedRule?.id]);

    useEffect(() => {
        const fetchRules = async () => {
            setLoadingRules(true);
            try {
                const res = await api.get("/assessment-rules?status=active_template");
                setRules(res.data.data || []);
            } catch {
                toast.error("Failed to load assessment rules");
            } finally {
                setLoadingRules(false);
            }
        };
        fetchRules();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.rule_id) {
            toast.error("Name and Rule are required");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/drives", {
                name: formData.name,
                rule_id: formData.rule_id,
                duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
                attempt_limit: formData.attempt_limit ? parseInt(formData.attempt_limit) : 1,
                proctoring_mode: formData.proctoring_mode,
                scheduled_start: formData.scheduled_start || undefined,
                scheduled_end: formData.scheduled_end || undefined,
                max_applicants: formData.max_applicants ? parseInt(formData.max_applicants) : 500,
                auto_generate_pool: true,
            });
            toast.success("Drive created — pool generation started automatically");
            navigate("/app/drives");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create drive");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="bg-indigo-600 px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate("/app/drives")}
                        className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Drives
                    </button>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Rocket className="h-7 w-7" /> Launch New Drive
                    </h1>
                    <p className="text-indigo-200 text-sm font-medium mt-1 uppercase tracking-wider">Initialize Recruitment Instance</p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto px-8 py-10">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8">

                        {/* Drive Name */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Drive Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Summer Internship 2026"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full py-3 px-4 text-slate-900 font-bold placeholder:text-slate-300 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg"
                            />
                        </div>

                        {/* Assessment Rule */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assessment Rule</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    required
                                    value={formData.rule_id}
                                    onChange={e => setFormData({ ...formData, rule_id: e.target.value })}
                                    disabled={loadingRules || !!initialRuleId}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:bg-slate-100"
                                    aria-label="Assessment Rule"
                                >
                                    <option value="" disabled>Select an assessment rule...</option>
                                    {rules.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (v{r.version})
                                        </option>
                                    ))}
                                </select>
                                {loadingRules && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />}
                            </div>
                            {selectedRule && (
                                <p className="text-xs text-slate-400 mt-2 ml-1 font-bold">
                                    v{selectedRule.version} · {selectedRule.total_questions || 30} questions · {selectedRule.duration_minutes || 60} min
                                </p>
                            )}
                        </div>

                        {/* Duration & Attempts */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="600"
                                        placeholder="60"
                                        value={formData.duration_minutes}
                                        onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Attempts</label>
                                <div className="relative">
                                    <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.attempt_limit}
                                        onChange={e => setFormData({ ...formData, attempt_limit: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Proctoring */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proctoring</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    value={formData.proctoring_mode}
                                    onChange={e => setFormData({ ...formData, proctoring_mode: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    aria-label="Proctoring Mode"
                                >
                                    <option value="none">None</option>
                                    <option value="standard">Standard (webcam + tab switch detection)</option>
                                    <option value="strict">Strict (full AI proctoring)</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Starts</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_start}
                                        onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ends</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_end}
                                        onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Max Applicants */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Max Applicants</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={formData.max_applicants}
                                    onChange={e => setFormData({ ...formData, max_applicants: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        {/* Snapshot notice */}
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                <span className="uppercase text-amber-800 tracking-wider">Snapshot Architecture:</span> By creating this drive, the system will capture a frozen copy of the selected rule. Changes to the template later will not affect this drive.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/app/drives")}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                            {submitting ? "Launching..." : "Launch Drive"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
