import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { ArrowLeft, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const SYSTEM_ROLES = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR Manager" },
    { value: "engineer", label: "Engineer" },
    { value: "cxo", label: "Executive (CXO)" },
];

const COLLEGE_ROLES = [
    { value: "college_admin", label: "College Admin" },
    { value: "college", label: "College" },
    { value: "college_staff", label: "College Staff" },
    { value: "student", label: "Student" },
];

export default function CreateUserPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [userType, setUserType] = useState<"system" | "college">("system");

    const { data: campuses } = useQuery({
        queryKey: ["campuses"],
        queryFn: async () => {
            const { data } = await api.get("/campuses");
            return data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (newUser: any) => api.post("/users", newUser),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("New user added successfully");
            navigate(-1);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to add user");
        }
    });

    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = `${fd.get("firstName")} ${fd.get("lastName")}`.trim();

        createMutation.mutate({
            name: name,
            email: fd.get("email"),
            password: fd.get("password"),
            role: fd.get("role"),
            college_id: userType === "college" ? fd.get("college_id") : undefined
        });
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
                        <UserPlus className="h-7 w-7" /> Add User
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold mt-1 uppercase tracking-wider">Create a new system or college user account</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        {/* User Type Selector */}
                        <div className="flex rounded-xl bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setUserType("system")}
                                className={clsx(
                                    "w-1/2 py-2 text-sm font-bold rounded-lg transition-all",
                                    userType === "system" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                System User
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType("college")}
                                className={clsx(
                                    "w-1/2 py-2 text-sm font-bold rounded-lg transition-all",
                                    userType === "college" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                College User
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">First Name</label>
                                <input
                                    required
                                    name="firstName"
                                    placeholder="John"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Name</label>
                                <input
                                    required
                                    name="lastName"
                                    placeholder="Doe"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="john.doe@example.com"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Initial Password</label>
                            <input
                                required
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Role</label>
                            <select
                                required
                                name="role"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                {userType === "system" ? (
                                    SYSTEM_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                ) : (
                                    COLLEGE_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                )}
                            </select>
                        </div>

                        {userType === "college" && (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned College</label>
                                <select
                                    required
                                    name="college_id"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Select a college...</option>
                                    {campuses?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {createMutation.isPending ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
