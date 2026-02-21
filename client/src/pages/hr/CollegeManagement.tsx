import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Plus, School, MapPin, Users, Search, X, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

interface Campus {
    id: string;
    name: string;
    city: string;
    state: string;
    tier: string;
    student_count: number;
    college_code: string;
    created_at: string;
}

export default function CollegeManagement() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();

    // Queries
    const { data: campuses, isLoading } = useQuery({
        queryKey: ["campuses"],
        queryFn: async () => {
            const { data } = await api.get("/campuses");
            return data.data as Campus[];
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (newCampus: Partial<Campus>) => {
            const { data } = await api.post("/campuses", newCampus);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campuses"] });
            setIsModalOpen(false);
            toast.success("Campus added successfully!");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || "Failed to add campus");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedCampus: Campus) => {
            const { data } = await api.put(`/campuses/${updatedCampus.id}`, updatedCampus);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campuses"] });
            setEditingCampus(null);
            toast.success("Campus updated successfully!");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || "Failed to update campus");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/campuses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campuses"] });
            toast.success("Campus deleted successfully");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || "Failed to delete campus");
        },
    });

    const filteredCampuses = campuses?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = campuses?.reduce((acc, c) => acc + (c.student_count || 0), 0) || 0;

    const handleEdit = (campus: Campus) => {
        setEditingCampus(campus);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure? This will permanently delete the campus record.")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Campus Management
                    </h1>
                    <p className="mt-1.5 text-gray-500">
                        Manage your institutional network and <span className="font-semibold text-indigo-600">{campuses?.length || 0}</span> campus partnerships.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search campuses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm font-medium shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 w-56"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Register Campus
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Campuses",
                        value: campuses?.length || 0,
                        trend: "Registered partners",
                        color: (campuses?.length || 0) > 0 ? "bg-indigo-500" : "bg-gray-400",
                    },
                    {
                        label: "Global Talent Pool",
                        value: totalStudents.toLocaleString(),
                        trend: "Enrolled students",
                        color: totalStudents > 0 ? "bg-emerald-500" : "bg-gray-400",
                    },
                    {
                        label: "Tier 1 Campuses",
                        value: campuses?.filter(c => c.tier === "Tier 1").length || 0,
                        trend: "Premium institutions",
                        color: "bg-purple-500",
                    },
                    {
                        label: "Avg. Students/Campus",
                        value: campuses?.length ? Math.round(totalStudents / campuses.length) : 0,
                        trend: "Per institution",
                        color: "bg-blue-500",
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

            {/* ── Campus List ── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-6 bg-gray-50/30 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 italic">Institutional Partners</h2>
                    <span className="text-sm text-gray-400 font-medium">
                        {filteredCampuses?.length || 0} active records
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
                        ))}
                    </div>
                ) : filteredCampuses?.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Institution</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Login Slug</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tier</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Talent</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCampuses.map((campus) => (
                                    <tr
                                        key={campus.id}
                                        className="group transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shadow-sm">
                                                    <School className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {campus.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Registered {new Date(campus.created_at).getFullYear()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                {campus.city}, {campus.state}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/register-student?college=${campus.college_code}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success("Registration link copied!");
                                                }}
                                                className="group/slug flex items-center gap-2 text-xs font-mono text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-md transition-all hover:bg-indigo-100/50"
                                                title="Click to copy registration link"
                                            >
                                                <span className="font-bold underline decoration-indigo-200 underline-offset-2">@{campus.college_code}</span>
                                                <Plus className="h-3 w-3 opacity-0 group-hover/slug:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                campus.tier === "Tier 1" ? "bg-purple-50 text-purple-700" :
                                                    campus.tier === "Tier 2" ? "bg-blue-50 text-blue-700" :
                                                        "bg-gray-100 text-gray-600"
                                            )}>
                                                {campus.tier || "Standard"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => navigate(`/students?campus=${campus.name}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-bold"
                                            >
                                                <Users className="h-3.5 w-3.5" />
                                                {campus.student_count || 0}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(campus)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(campus.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="rounded-full bg-indigo-50 p-4">
                            <School className="h-8 w-8 text-indigo-300" />
                        </div>
                        <h4 className="mt-4 font-semibold text-gray-900">No campuses found</h4>
                        <p className="mt-1 text-sm text-gray-500 max-w-[240px]">
                            Register your first partner institution to start scaling recruitment.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Add/Edit Modal ── */}
            {(isModalOpen || editingCampus) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingCampus(null); }} />

                    <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300 overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <School className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{editingCampus ? "Update Campus" : "Register Campus"}</h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {editingCampus ? "Modify existing partner details" : "Add a new institution to your network"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setEditingCampus(null); }} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                name: formData.get("name") as string,
                                city: formData.get("city") as string,
                                state: formData.get("state") as string,
                                tier: formData.get("tier") as string,
                            };

                            if (editingCampus) {
                                updateMutation.mutate({ ...editingCampus, ...data });
                            } else {
                                const fullData = {
                                    ...data,
                                    adminName: formData.get("adminName") as string,
                                    adminEmail: formData.get("adminEmail") as string,
                                    adminPassword: formData.get("adminPassword") as string,
                                };
                                createMutation.mutate(fullData);
                            }
                        }} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution Name</label>
                                <input
                                    required
                                    name="name"
                                    defaultValue={editingCampus?.name || ""}
                                    placeholder="e.g. Indian Institute of Technology, Madras"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                                    <input
                                        required
                                        name="city"
                                        defaultValue={editingCampus?.city || ""}
                                        placeholder="Chennai"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                                    <input
                                        required
                                        name="state"
                                        defaultValue={editingCampus?.state || ""}
                                        placeholder="Tamil Nadu"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier Classification</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Tier 1", "Tier 2", "Tier 3"].map((t) => (
                                        <label key={t} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tier"
                                                value={t}
                                                className="peer hidden"
                                                defaultChecked={editingCampus ? editingCampus.tier === t : t === "Tier 1"}
                                            />
                                            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-500 transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-600">
                                                {t}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {!editingCampus && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 px-1">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">College Admin Setup</h4>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Admin Full Name</label>
                                        <input
                                            required
                                            name="adminName"
                                            placeholder="John Doe"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Admin Email</label>
                                            <input
                                                required
                                                type="email"
                                                name="adminEmail"
                                                placeholder="admin@college.edu"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Initial Password</label>
                                            <input
                                                required
                                                type="password"
                                                name="adminPassword"
                                                placeholder="••••••••"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingCampus(null); }}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-[2] rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? "Pending..." : editingCampus ? "Update Details" : "Register Campus"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
