import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, authActions } from "../../stores/authStore";
import api from "../../lib/api";
import { toast } from "react-hot-toast";

export default function PasswordSetupPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // Assuming we'll add a specific endpoint for this or use a generic profile update
            // For now, let's assume POST /api/auth/setup-password
            await api.post("/auth/setup-password", { password: newPassword });

            toast.success("Password updated successfully!");

            // Update local state to reflect password change
            if (user) {
                authActions.setUser({
                    ...user,
                    must_change_password: false
                });
            }

            // Redirect to appropriate dashboard
            navigate("/");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Secure Your Account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Welcome, {user?.name}! Since this is your first login, please set a new password for security.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handlePasswordChange}>
                        <div>
                            <label htmlFor="new-password" title="New Password" className="block text-sm font-semibold text-slate-700">
                                New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="new-password"
                                    name="password"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" title="Confirm Password" className="block text-sm font-semibold text-slate-700">
                                Confirm New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? "Updating..." : "Set Password & Continue"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
