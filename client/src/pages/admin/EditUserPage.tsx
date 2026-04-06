import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { ArrowLeft, UserCog, Key, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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

export default function EditUserPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const [editForm, setEditForm] = useState<any>({
        name: "",
        email: "",
        role: "",
        college_id: undefined,
        type: "system",
    });
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    const { data: user, isLoading } = useQuery({
        queryKey: ["user", id],
        queryFn: async () => {
            const { data } = await api.get(`/users/${id}`);
            return data.data;
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (user) {
            const isCollegeRole = COLLEGE_ROLES.some(r => r.value === user.role);
            setEditForm({
                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email,
                role: user.role,
                college_id: user.college_id || undefined,
                type: isCollegeRole ? "college" : "system",
            });
        }
    }, [user]);

    const updateUserMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/users/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", id] });
            toast.success("User details updated");
            navigate(-1);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update user");
        }
    });

    const updatePasswordMutation = useMutation({
        mutationFn: (password: string) => api.put(`/users/${id}/password`, { password }),
        onSuccess: (res) => {
            toast.success(res.data.message || "Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordSection(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update password");
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name || !editForm.email || !editForm.role) {
            toast.error("Name, email, and role are required");
            return;
        }
        updateUserMutation.mutate({
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            college_id: editForm.college_id,
        });
    };

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        updatePasswordMutation.mutate(newPassword);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const roleOptions = editForm.type === "system" ? SYSTEM_ROLES : COLLEGE_ROLES;

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
                        <UserCog className="h-7 w-7" /> Edit User
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold mt-1 uppercase tracking-wider">
                        {user?.name || user?.email || "User Details"}
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">
                {/* Edit Details */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-black text-slate-800 mb-6">User Details</h2>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Full Name"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="Email Address"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Role</label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                {roleOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
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
                                disabled={updateUserMutation.isPending}
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Key className="h-5 w-5 text-amber-500" /> Change Password
                        </h2>
                        {!showPasswordSection && (
                            <button
                                onClick={() => setShowPasswordSection(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
                            >
                                <Key className="h-3.5 w-3.5" />
                                Set New Password
                            </button>
                        )}
                    </div>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordUpdate} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">New Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Confirm Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordSection(false); setNewPassword(""); setConfirmPassword(""); }}
                                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePasswordMutation.isPending}
                                    className="flex-[2] py-3.5 rounded-2xl bg-amber-500 text-sm font-black text-white shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    )}

                    {!showPasswordSection && (
                        <p className="text-sm text-slate-400 font-medium">Click "Set New Password" to change this user's password.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
