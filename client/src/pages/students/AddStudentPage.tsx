import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AddStudentPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: campuses } = useQuery({
        queryKey: ["campuses"],
        queryFn: async () => {
            const { data } = await api.get("/campuses");
            return data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (payload: any) => api.post("/students", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student added successfully");
            navigate(-1);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to add student");
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload: any = {};
        fd.forEach((value, key) => {
            if (value !== "") payload[key] = value;
        });
        createMutation.mutate(payload);
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
                        <UserPlus className="h-7 w-7" /> Add Student
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold mt-1 uppercase tracking-wider">Register a new student to the talent pool</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                                <input
                                    required
                                    name="first_name"
                                    placeholder="John"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                                <input
                                    required
                                    name="last_name"
                                    placeholder="Doe"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="john.doe@example.com"
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Initial Password</label>
                            <input
                                required
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Campus</label>
                            <select
                                required
                                name="college_id"
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select a campus...</option>
                                {campuses?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Major / Branch</label>
                                <input
                                    name="major"
                                    placeholder="e.g. Computer Science"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">CGPA</label>
                                <input
                                    name="cgpa"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    placeholder="e.g. 8.50"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Degree</label>
                                <select
                                    name="degree"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Select degree...</option>
                                    <option value="btech">B.Tech</option>
                                    <option value="be">B.E</option>
                                    <option value="mtech">M.Tech</option>
                                    <option value="mba">MBA</option>
                                    <option value="bsc">B.Sc</option>
                                    <option value="msc">M.Sc</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Graduation Year</label>
                                <input
                                    name="graduation_year"
                                    type="number"
                                    min="2020"
                                    max="2030"
                                    placeholder="e.g. 2025"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Roll Number</label>
                            <input
                                name="roll_number"
                                placeholder="e.g. CS2021001"
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="pt-4 flex gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                {createMutation.isPending ? "Adding..." : "Add Student"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
