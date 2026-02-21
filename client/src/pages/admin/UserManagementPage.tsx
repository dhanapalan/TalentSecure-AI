import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import {
    MagnifyingGlassIcon,
    UserCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    FunnelIcon,
    EnvelopeIcon,
    PlusIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const ROLE_OPTIONS = [
    { value: "super_admin", label: "Super Admin", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { value: "admin", label: "Admin", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { value: "hr", label: "HR Manager", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { value: "engineer", label: "Engineer", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { value: "cxo", label: "Executive (CXO)", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { value: "college_admin", label: "College Admin", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { value: "student", label: "Student", color: "text-gray-600 bg-gray-50 border-gray-100" },
];

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role);
    const isAdmin = userRole === "super_admin" || userRole === "admin";
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch Users
    const { data: users, isLoading } = useQuery({
        queryKey: ["users", roleFilter, search],
        queryFn: async () => {
            const { data } = await api.get(`/users`, {
                params: { role: roleFilter, search: search }
            });
            return data.data;
        },
    });

    // Role Update Mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            api.put(`/users/${id}/role`, { role }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.data.message || "User role updated");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to update role");
        }
    });

    // Delete User Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User removed from system");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to remove user");
        }
    });

    // Create User Mutation
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

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">

            {/* Toolbar */}
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
                            {ROLE_OPTIONS.map(r => (
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
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 text-nowrap"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden p-0 border-gray-100 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User Profile</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">System Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                        Loading personnel records...
                                    </td>
                                </tr>
                            ) : users?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        No users matching your current active filters.
                                    </td>
                                </tr>
                            ) : (
                                users?.map((user: any) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black shadow-inner">
                                                    {user.first_name[0]}{user.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 leading-none">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                                                    {user.email}
                                                </div>
                                                {user.college_name && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-primary-500 font-bold">
                                                        <UserCircleIcon className="h-3 w-3" />
                                                        {user.college_name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative max-w-[160px]">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                                                    disabled={updateRoleMutation.isPending || !isAdmin}
                                                    className={clsx(
                                                        "w-full appearance-none rounded-lg border px-3 py-1.5 text-xs font-bold transition-all pr-8 shadow-sm",
                                                        !isAdmin ? "cursor-not-allowed opacity-75" : "cursor-pointer whitespace-nowrap",
                                                        ROLE_OPTIONS.find(r => r.value === user.role)?.color || "bg-gray-50 border-gray-200 text-gray-600"
                                                    )}
                                                >
                                                    {ROLE_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-normal">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                                    <FunnelIcon className="h-3 w-3 opacity-50" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                user.is_active
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            )}>
                                                {user.is_active ? (
                                                    <>
                                                        <CheckCircleIcon className="h-3 w-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircleIcon className="h-3 w-3" />
                                                        Deactivated
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                                                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove User"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm self-start">
                    <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900 italic">Access Control Notice</h4>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Changes to system roles take effect on the user's next login or session refresh.
                        Exercise caution when promoting users to <strong>Super Admin</strong> status as they will have unrestricted access to all data and configurations.
                    </p>
                </div>
            </div>
            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                    <PlusIcon className="h-5 w-5 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Add System User</h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            createMutation.mutate({
                                firstName: fd.get("firstName"),
                                lastName: fd.get("lastName"),
                                email: fd.get("email"),
                                password: fd.get("password"),
                                role: fd.get("role"),
                            });
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">First Name</label>
                                    <input
                                        required
                                        name="firstName"
                                        placeholder="John"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Name</label>
                                    <input
                                        required
                                        name="lastName"
                                        placeholder="Doe"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    placeholder="john.doe@company.com"
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Initial Password</label>
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">System Role</label>
                                <select
                                    required
                                    name="role"
                                    defaultValue="engineer"
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                >
                                    {ROLE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-[2] px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-icons not imported above
function ShieldCheckIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 1.573.317 3.074.888 4.443.57 1.37 1.411 2.503 2.512 3.398l3.6 2.88a1.5 1.5 0 001.5 0l3.6-2.88a12.012 12.012 0 002.511-3.398c.571-1.37.889-2.87.889-4.443 0-1.274-.187-2.503-.537-3.66A11.959 11.959 0 0112 2.714z" />
        </svg>
    );
}
