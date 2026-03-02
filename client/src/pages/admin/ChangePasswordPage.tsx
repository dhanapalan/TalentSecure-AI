import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { KeyIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const updatePasswordMutation = useMutation({
        mutationFn: (newPassword: string) => api.put(`/users/${id}/password`, { password: newPassword }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.data.message || "Password updated successfully");
            navigate("/app/administration");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update password");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        updatePasswordMutation.mutate(password);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 pt-4">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate("/app/administration")}
                    className="p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Change User Password</h1>
                    <p className="text-gray-500 text-sm font-medium">Set a new password for the selected user.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                        <div className="relative">
                            <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">Must be at least 6 characters long.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                        <div className="relative">
                            <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                                required
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate("/app/administration")}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updatePasswordMutation.isPending}
                            className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
