import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Target, Building2, Loader2, GitBranch, ArrowLeft } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface Campus {
    id: string;
    name: string;
}

export default function AssignCampusPage() {
    const navigate = useNavigate();
    const { id: driveId } = useParams<{ id: string }>();

    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [loadingCampuses, setLoadingCampuses] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        college_id: "",
        segment: "",
    });

    useEffect(() => {
        fetchCampuses();
    }, []);

    const fetchCampuses = async () => {
        setLoadingCampuses(true);
        try {
            const res = await api.get("/campuses");
            setCampuses(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch campuses", error);
        } finally {
            setLoadingCampuses(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.college_id) {
            toast.error("Campus is required");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/drives/${driveId}/assignments`, formData);
            toast.success("Campus assigned successfully");
            navigate(-1);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to assign campus");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-indigo-600 px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Target className="h-7 w-7" /> Assign Campus
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold mt-1 uppercase tracking-wider">Map Students to Drive</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campus Selection */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Campus</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    required
                                    value={formData.college_id}
                                    onChange={e => setFormData({ ...formData, college_id: e.target.value })}
                                    disabled={loadingCampuses}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                                >
                                    <option value="" disabled>Select a campus...</option>
                                    {campuses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {loadingCampuses && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />}
                            </div>
                        </div>

                        {/* Segment */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Segment (Optional)</label>
                            <div className="relative group">
                                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="e.g. B.Tech Computer Science"
                                    value={formData.segment}
                                    onChange={e => setFormData({ ...formData, segment: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 ml-1 font-medium">Leave blank to assign all eligible students from this campus.</p>
                        </div>

                        <div className="mt-10 flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                                {submitting ? "Assigning..." : "Confirm Assignment"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
