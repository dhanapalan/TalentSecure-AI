import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import {
    MagnifyingGlassIcon,
    UserCircleIcon,
    FunnelIcon,
    EnvelopeIcon,
    PlusIcon,
    XMarkIcon,
    KeyIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const SYSTEM_ROLES = [
    { value: "super_admin", label: "Super Admin", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { value: "admin", label: "Admin", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { value: "hr", label: "HR Manager", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { value: "engineer", label: "Engineer", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { value: "cxo", label: "Executive (CXO)", color: "text-amber-600 bg-amber-50 border-amber-100" },
];

const COLLEGE_ROLES = [
    { value: "college_admin", label: "College Admin", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { value: "college", label: "College", color: "text-sky-600 bg-sky-50 border-sky-100" },
    { value: "college_staff", label: "College Staff", color: "text-teal-600 bg-teal-50 border-teal-100" },
    { value: "student", label: "Student", color: "text-gray-600 bg-gray-50 border-gray-100" },
];

const ALL_ROLES = [...SYSTEM_ROLES, ...COLLEGE_ROLES];

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role);
    const isAdmin = userRole === "super_admin" || userRole === "admin";
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    // Add User Flow states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userType, setUserType] = useState<"system" | "college">("system");

    // Inline editing states
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // Change Password states
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["users", roleFilter, search],
        queryFn: async () => {
            const { data } = await api.get(`/users`, {
                params: { role: roleFilter, search: search }
            });
            return data.data;
        },
    });

    const { data: campuses } = useQuery({
        queryKey: ["campuses"],
        queryFn: async () => {
            const { data } = await api.get("/campuses");
            return data.data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.put(`/users/${id}/status`, { status }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.data.message || "User status updated");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update status");
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: any }) => api.put(`/users/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUserId(null);
            toast.success("User details updated");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update user");
        }
    });

    const updatePasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: string, password: string }) => api.put(`/users/${id}/password`, { password }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.data.message || "Password updated successfully");
            setIsPasswordModalOpen(false);
            setPasswordUserId(null);
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update password");
        }
    });

    const createMutation = useMutation({
        mutationFn: (newUser: any) => api.post("/users", newUser),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsAddModalOpen(false);
            toast.success("New user added successfully");
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

    const handleRowDoubleClick = (user: any) => {
        if (!isAdmin) return;
        setEditingUserId(user.id);
        setEditForm({
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            role: user.role,
            college_id: user.college_id || undefined, // Keep existing college_id
            type: COLLEGE_ROLES.some(r => r.value === user.role) ? 'college' : 'system'
        });
    };

    const saveInlineEdit = () => {
        if (!editForm.name || !editForm.email || !editForm.role) {
            toast.error("Name, email, and role are required");
            return;
        }
        updateUserMutation.mutate({
            id: editingUserId!,
            payload: {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                // Pass existing college_id back (will not be changed by user in inline edit)
                college_id: editForm.college_id
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-1 items-center gap-4 w-full">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-gray-600 focus:ring-0 cursor-pointer"
                        >
                            <option value="">All Roles</option>
                            {ALL_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden md:inline text-xs font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-widest text-nowrap">
                        {users?.length || 0} Records
                    </span>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setUserType("system");
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 text-nowrap"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="card overflow-hidden p-0 border-gray-100 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User Profile</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">System Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Access Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">Loading personnel records...</td></tr>
                            ) : users?.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No users matching your current active filters.</td></tr>
                            ) : (
                                users?.map((user: any) => {
                                    const isEditing = editingUserId === user.id;

                                    return (
                                        <tr key={user.id}
                                            onDoubleClick={() => handleRowDoubleClick(user)}
                                            className={clsx("group transition-colors", isEditing ? "bg-blue-50/30" : "hover:bg-gray-50/50 cursor-pointer")}
                                        >
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                                        placeholder="Full Name"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black shadow-inner">
                                                            {(user.name ? user.name[0] : (user.first_name?.[0] || "U")).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-none">
                                                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                                        placeholder="Email Address"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                                                            {user.email}
                                                        </div>
                                                        {user.college_name && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-primary-500 font-bold max-w-[150px] truncate">
                                                                <UserCircleIcon className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate" title={user.college_name}>{user.college_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2 relative">
                                                        <select
                                                            value={editForm.role}
                                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                            className="w-full px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                                        >
                                                            {editForm.type === 'system' ? (
                                                                SYSTEM_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                                            ) : (
                                                                COLLEGE_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                                            )}
                                                        </select>
                                                        {/* We intentionally do not show a college switcher here */}
                                                    </div>
                                                ) : (
                                                    <div className={clsx(
                                                        "inline-block px-3 py-1.5 rounded-lg text-xs font-bold border",
                                                        ALL_ROLES.find(r => r.value === user.role)?.color || "bg-gray-50 border-gray-200 text-gray-600"
                                                    )}>
                                                        {ALL_ROLES.find(r => r.value === user.role)?.label || user.role}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStatusMutation.mutate({
                                                            id: user.id,
                                                            status: user.is_active ? "Inactive" : "Active"
                                                        })
                                                    }}
                                                    disabled={updateStatusMutation.isPending || !isAdmin}
                                                    className={clsx(
                                                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                                                        user.is_active ? 'bg-emerald-500' : 'bg-gray-200',
                                                        (!isAdmin) && "opacity-50 cursor-not-allowed",
                                                        isEditing && "opacity-50 cursor-not-allowed pointer-events-none"
                                                    )}
                                                >
                                                    <span className="sr-only">Toggle user status</span>
                                                    <span
                                                        className={clsx(
                                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                            user.is_active ? 'translate-x-5' : 'translate-x-0'
                                                        )}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2 justify-end items-end">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingUserId(null);
                                                                }}
                                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    saveInlineEdit();
                                                                }}
                                                                disabled={updateUserMutation.isPending}
                                                                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-50"
                                                            >
                                                                {updateUserMutation.isPending ? "Saving..." : "Save"}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPasswordUserId(user.id);
                                                                setIsPasswordModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors w-full justify-center"
                                                        >
                                                            <KeyIcon className="h-3.5 w-3.5" />
                                                            Change Password
                                                        </button>
                                                    </div>
                                                ) : isAdmin ? (
                                                    <span className="text-[10px] text-gray-400 italic opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Double-click to edit
                                                    </span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                    <PlusIcon className="h-5 w-5 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Add User</h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                            {/* User Type Selector */}
                            <div className="flex rounded-xl bg-gray-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setUserType("system")}
                                    className={clsx(
                                        "w-1/2 py-2 text-sm font-bold rounded-lg transition-all",
                                        userType === "system" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    System User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType("college")}
                                    className={clsx(
                                        "w-1/2 py-2 text-sm font-bold rounded-lg transition-all",
                                        userType === "college" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    College User
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">First Name</label>
                                    <input required name="firstName" placeholder="John" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Name</label>
                                    <input required name="lastName" placeholder="Doe" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</label>
                                <input required type="email" name="email" placeholder="john.doe@example.com" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Initial Password</label>
                                <input required type="password" name="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Role</label>
                                    <select required name="role" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500">
                                        {userType === "system" ? (
                                            SYSTEM_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                        ) : (
                                            COLLEGE_ROLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                        )}
                                    </select>
                                </div>

                                {userType === "college" && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Assigned College</label>
                                        <select required name="college_id" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-primary-700 focus:ring-2 focus:ring-primary-500">
                                            <option value="">Select a college...</option>
                                            {campuses?.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending} className="flex-[2] px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50">
                                    {createMutation.isPending ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && passwordUserId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                    <KeyIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (newPassword.length < 6) {
                                toast.error("Password must be at least 6 characters.");
                                return;
                            }
                            if (newPassword !== confirmPassword) {
                                toast.error("Passwords do not match.");
                                return;
                            }
                            updatePasswordMutation.mutate({ id: passwordUserId, password: newPassword });
                        }} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">New Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Confirm Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={updatePasswordMutation.isPending} className="flex-[2] px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50">
                                    {updatePasswordMutation.isPending ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
