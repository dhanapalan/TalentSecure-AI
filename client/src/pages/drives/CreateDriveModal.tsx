import { useState, useEffect } from "react";
import { X, Calendar, Rocket, ClipboardList, Loader2, Clock, RefreshCw, Shield } from "lucide-react";
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

interface CreateDriveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialRuleId?: string | null;
}

export default function CreateDriveModal({ isOpen, onClose, onSuccess, initialRuleId }: CreateDriveModalProps) {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        rule_id: "",
        duration_minutes: "",
        attempt_limit: "1",
        proctoring_mode: "standard",
        scheduled_start: "",
        scheduled_end: "",
    });

    // When rule changes, pre-fill defaults from the selected rule
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
        if (isOpen) {
            fetchRules();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialRuleId) {
            setFormData(prev => ({ ...prev, rule_id: initialRuleId }));
        }
    }, [initialRuleId]);

    const fetchRules = async () => {
        setLoadingRules(true);
        try {
            const res = await api.get("/assessment-rules?status=active_template");
            setRules(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setLoadingRules(false);
        }
    };

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
                auto_generate_pool: true,
            });
            toast.success("Drive created — pool generation started automatically");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create drive");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl shadow-indigo-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between text-white">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <Rocket className="h-5 w-5" /> Launch New Drive
                        </h2>
                        <p className="text-indigo-100/80 text-xs font-bold mt-1 uppercase tracking-wider">Initialize Recruitment Instance</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors" aria-label="Close modal" title="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        {/* Drive Name */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Drive Name</label>
                            <div className="relative group">
                                <div className="absolute inset-x-0 -bottom-px h-px bg-slate-200 group-focus-within:bg-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Summer Internship 2026"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full py-3 px-1 text-slate-900 font-bold placeholder:text-slate-300 border-none bg-transparent focus:ring-0 outline-none text-lg transition-all"
                                />
                            </div>
                        </div>

                        {/* Rule Selection */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assessment Rule</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    required
                                    value={formData.rule_id}
                                    onChange={e => setFormData({ ...formData, rule_id: e.target.value })}
                                    disabled={loadingRules || !!initialRuleId}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                                    aria-label="Assessment Rule"
                                    title="Assessment Rule"
                                >
                                    <option value="" disabled>Select an assessment rule...</option>
                                    {rules.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (v{r.version})
                                        </option>
                                    ))}
                                </select>
                                {loadingRules && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />}
                            </div>
                            {selectedRule && (
                                <p className="text-[10px] text-slate-400 mt-1 ml-1 font-bold">
                                    v{selectedRule.version} · {selectedRule.total_questions || 30} questions · {selectedRule.duration_minutes || 60} min
                                </p>
                            )}
                        </div>

                        {/* Duration & Attempts */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="600"
                                        placeholder="60"
                                        value={formData.duration_minutes}
                                        onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Attempts</label>
                                <div className="relative">
                                    <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.attempt_limit}
                                        onChange={e => setFormData({ ...formData, attempt_limit: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="Attempts"
                                        title="Attempts"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Proctoring Mode */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proctoring</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    value={formData.proctoring_mode}
                                    onChange={e => setFormData({ ...formData, proctoring_mode: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                                    aria-label="Proctoring Mode"
                                    title="Proctoring Mode"
                                >
                                    <option value="none">None</option>
                                    <option value="standard">Standard (webcam + tab switch detection)</option>
                                    <option value="strict">Strict (full AI proctoring)</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">Starts</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_start}
                                        onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                                        className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Start date and time"
                                        title="Start date and time"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">Ends</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_end}
                                        onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                                        className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="End date and time"
                                        title="End date and time"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                <span className="uppercase text-amber-800 tracking-wider">Snapshot Architecture:</span> By creating this drive, the system will capture a frozen copy of the selected rule. Changes to the template later will not affect this drive.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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
