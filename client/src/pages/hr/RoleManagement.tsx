import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Plus, Briefcase, Users, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Role {
    id: string;
    title: string;
    company: string;
    description: string;
    status: string;
    max_positions: number;
    created_at: string;
}

export default function RoleManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: roles, isLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const { data } = await api.get("/roles");
            return data.data as Role[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newRole: Record<string, unknown>) => {
            const { data } = await api.post("/roles", newRole);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            setIsModalOpen(false);
            toast.success("Role created successfully!");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || "Failed to create role");
        },
    });

    const filteredRoles = roles?.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-xl border border-gray-100 bg-gray-50 py-2 pl-9 pr-4 text-sm font-medium shadow-none focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 w-56"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        New Role
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Roles",
                        value: roles?.length || 0,
                        trend: "All positions",
                        color: (roles?.length || 0) > 0 ? "bg-blue-500" : "bg-gray-400",
                    },
                    {
                        label: "Active Roles",
                        value: roles?.filter(r => r.status === "ACTIVE").length || 0,
                        trend: "Currently hiring",
                        color: "bg-emerald-500",
                    },
                    {
                        label: "Total Openings",
                        value: roles?.reduce((acc, r) => acc + (r.max_positions || 0), 0) || 0,
                        trend: "Across all roles",
                        color: "bg-purple-500",
                    },
                    {
                        label: "Draft Roles",
                        value: roles?.filter(r => r.status === "DRAFT").length || 0,
                        trend: "Pending review",
                        color: "bg-amber-500",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
                    >
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <div className="mt-2 flex items-baseline justify-between">
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                {stat.trend}
                            </span>
                        </div>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full w-2/3 rounded-full ${stat.color} transition-all group-hover:w-full`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Roles Table ── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between p-6 pb-0">
                    <h2 className="text-xl font-bold text-gray-900 italic">All Roles</h2>
                    <span className="text-sm text-gray-400 font-medium">
                        {filteredRoles?.length || 0} role{(filteredRoles?.length || 0) !== 1 ? "s" : ""}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
                        ))}
                    </div>
                ) : filteredRoles?.length ? (
                    <div className="p-6 pt-4">
                        <div className="overflow-hidden rounded-xl border border-gray-100">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60">
                                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role Details</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Openings</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRoles.map((role) => (
                                        <tr key={role.id} className="group transition-colors hover:bg-indigo-50/40">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                        <Briefcase className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {role.title}
                                                        </span>
                                                        <p className="text-xs text-gray-400 mt-0.5">{role.company}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-900">{role.max_positions}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={clsx(
                                                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                    role.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                                                        role.status === "DRAFT" ? "bg-amber-50 text-amber-700" :
                                                            "bg-gray-100 text-gray-600"
                                                )}>
                                                    {role.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs text-gray-400 font-medium">
                                                {new Date(role.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="rounded-full bg-indigo-50 p-4">
                            <Briefcase className="h-8 w-8 text-indigo-300" />
                        </div>
                        <h4 className="mt-4 font-semibold text-gray-900">No roles found</h4>
                        <p className="mt-1 text-sm text-gray-500 max-w-[240px]">
                            Create your first job role to start building your recruitment pipeline.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800"
                        >
                            Create First Role
                        </button>
                    </div>
                )}
            </div>

            {/* ── Create Role Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300 overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">New Role</h3>
                                    <p className="text-xs text-gray-400 font-medium">Define a new job role for recruitment</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            createMutation.mutate({
                                title: fd.get("title") as string,
                                company: fd.get("company") as string,
                                description: fd.get("description") as string,
                                minCGPA: parseFloat(fd.get("minCGPA") as string) || 0,
                                maxPositions: parseInt(fd.get("maxPositions") as string) || 1,
                                eligibleDegrees: (fd.get("eligibleDegrees") as string).split(",").map(s => s.trim()).filter(Boolean),
                                eligibleMajors: (fd.get("eligibleMajors") as string).split(",").map(s => s.trim()).filter(Boolean),
                            });
                        }} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Title</label>
                                <input
                                    required
                                    name="title"
                                    placeholder="e.g. Software Engineer"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                                    <input
                                        required
                                        name="company"
                                        placeholder="GradLogic"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Positions</label>
                                    <input
                                        required
                                        name="maxPositions"
                                        type="number"
                                        min={1}
                                        defaultValue={1}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    required
                                    name="description"
                                    rows={3}
                                    placeholder="Brief description of the role..."
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Min CGPA</label>
                                    <input
                                        name="minCGPA"
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        max={10}
                                        defaultValue={6.0}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Degrees</label>
                                    <input
                                        name="eligibleDegrees"
                                        placeholder="B.Tech, M.Tech"
                                        defaultValue="B.Tech"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Majors</label>
                                    <input
                                        name="eligibleMajors"
                                        placeholder="CSE, IT"
                                        defaultValue="CSE"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-[2] rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
