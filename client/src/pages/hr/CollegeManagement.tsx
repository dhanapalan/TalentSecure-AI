import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import {
    Plus,
    School,
    Users,
    Search,
    X,
    Pencil,
    Activity,
    Shield,
    Upload,
    Download
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Campus {
    id: string;
    name: string;
    city: string;
    state: string;
    tier: string;
    student_count: number;
    college_code: string;
    created_at: string;
    is_active: boolean;
}

export default function CollegeManagement() {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);
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
            setIsFormVisible(false);
            toast.success("Campus added successfully!");
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to add campus"
            );
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
            setIsFormVisible(false);
            toast.success("Campus details updated!");
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to update campus"
            );
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/campuses/${id}`);
            return data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["campuses"] });
            toast.success(`Campus ${data.is_active ? "activated" : "deactivated"} successfully`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || "Failed to toggle status");
        },
    });

    const bulkMutation = useMutation({
        mutationFn: (data: { college_id: string; students: any[] }) => api.post("/students/bulk", data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["campuses"] });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success(res.data.message || "Bulk import successful");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Bulk import failed");
        },
        onSettled: () => setIsUploading(false)
    });

    const filteredCampuses = campuses?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.college_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = campuses?.reduce((acc, c) => acc + (c.student_count || 0), 0) || 0;
    const activeCampusesCount = campuses?.filter(c => c.is_active).length || 0;

    const handleEdit = (campus: Campus) => {
        setEditingCampus(campus);
        setIsFormVisible(true);
    };

    const closeCampusForm = () => {
        setEditingCampus(null);
        setIsFormVisible(false);
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingCampus) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split("\n").filter(l => l.trim());
            if (lines.length < 2) {
                toast.error("CSV file is empty or missing data rows");
                setIsUploading(false);
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const studentEntries = lines.slice(1).map(line => {
                const values = line.split(",").map(v => v.trim());
                const student: any = {};
                headers.forEach((header, i) => {
                    if (header === "name" || header === "email" || header === "password") {
                        student[header] = values[i];
                    }
                });
                return student;
            }).filter(s => s.name && s.email);

            if (studentEntries.length === 0) {
                toast.error("No valid student data found in CSV");
                setIsUploading(false);
                return;
            }

            bulkMutation.mutate({ college_id: editingCampus.id, students: studentEntries });
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Campus Management
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage partner institutions and track student registrations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search campuses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingCampus(null);
                            setIsFormVisible((current) => !current);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        {isFormVisible && !editingCampus ? "Close Form" : "Add Campus"}
                    </button>
                </div>
            </div>

            {/* ── Add/Edit Form ── */}
            {isFormVisible && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">
                            {editingCampus ? "Edit Campus Details" : "Register New Campus"}
                        </h3>
                        <button onClick={closeCampusForm} className="text-slate-400 hover:text-slate-600">
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
                    }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        <div className="space-y-6">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Institution Name</label>
                                <input
                                    required
                                    name="name"
                                    defaultValue={editingCampus?.name || ""}
                                    placeholder="e.g. NIT Trichy"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
                                    <input
                                        required
                                        name="city"
                                        defaultValue={editingCampus?.city || ""}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">State</label>
                                    <input
                                        required
                                        name="state"
                                        defaultValue={editingCampus?.state || ""}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Tier Classification</label>
                                <div className="flex gap-3">
                                    {["Tier 1", "Tier 2", "Tier 3"].map((t) => (
                                        <label key={t} className="flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tier"
                                                value={t}
                                                className="peer hidden"
                                                defaultChecked={editingCampus ? editingCampus.tier === t : t === "Tier 1"}
                                            />
                                            <div className="flex items-center justify-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-600">
                                                {t}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:border-l lg:border-slate-100 lg:pl-8">
                            {!editingCampus ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="h-4 w-4 text-indigo-600" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Admin Credentials</h4>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Admin Full Name</label>
                                        <input
                                            required
                                            name="adminName"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                name="adminEmail"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                                            <input
                                                required
                                                type="password"
                                                name="adminPassword"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-indigo-600" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Bulk Student Import</h4>
                                        </div>
                                        <a
                                            href="data:text/csv;charset=utf-8,name,email,password%0AJohn%20Doe,john@example.com,Welcome@123"
                                            download="student_template.csv"
                                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                                        >
                                            <Download className="h-3 w-3" />
                                            Template
                                        </a>
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleBulkUpload}
                                            disabled={isUploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                        />
                                        <div className={clsx(
                                            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all",
                                            "border-slate-200 bg-slate-50 group-hover:border-indigo-300 group-hover:bg-indigo-50/50"
                                        )}>
                                            {isUploading ? (
                                                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            )}
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-900">Click to upload CSV</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Expected: name, email, password</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                                        <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase">
                                            ⚠️ Headers must match: "name", "email", "password". Duplicate emails will be skipped.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeCampusForm}
                                className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="rounded-xl bg-slate-900 px-8 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                            >
                                {editingCampus ? "Update Campus" : "Save Campus"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "TOTAL CAMPUSES",
                        value: campuses?.length || 0,
                        icon: School,
                        color: "text-indigo-600",
                        bg: "bg-indigo-50",
                    },
                    {
                        label: "TOTAL STUDENTS",
                        value: totalStudents.toLocaleString(),
                        icon: Users,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                    },
                    {
                        label: "TIER 1 CAMPUSES",
                        value: campuses?.filter(c => c.tier === "Tier 1").length || 0,
                        icon: Shield,
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                    },
                    {
                        label: "ACTIVE STATUS",
                        value: activeCampusesCount,
                        icon: Activity,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center gap-4">
                            <div className={clsx("flex h-10 w-10 items-center justify-center rounded-lg", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Campus Table ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-lg font-bold text-slate-900">Partner Campuses</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {activeCampusesCount} Active / {campuses?.length || 0} Total
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />
                        ))}
                    </div>
                ) : filteredCampuses?.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">College Code</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tier</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Students</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCampuses.map((campus) => (
                                    <tr key={campus.id} className={clsx("transition-all hover:bg-slate-50/50", !campus.is_active && "opacity-60")}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg shadow-sm border border-slate-100", campus.is_active ? "bg-white text-indigo-600" : "bg-slate-50 text-slate-400")}>
                                                    <School className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{campus.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{campus.city}, {campus.state}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/student/register?college=${campus.college_code}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success("Registration link copied");
                                                }}
                                                className="text-xs font-mono font-bold text-indigo-600 hover:underline"
                                            >
                                                @{campus.college_code}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                {campus.tier || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatusMutation.mutate(campus.id)}
                                                disabled={toggleStatusMutation.isPending}
                                                className={clsx(
                                                    "relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                                                    campus.is_active ? 'bg-indigo-600' : 'bg-slate-200'
                                                )}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        campus.is_active ? 'translate-x-5' : 'translate-x-0'
                                                    )}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            {campus.student_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(campus)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <School className="mx-auto h-12 w-12 text-slate-200" />
                        <h4 className="mt-4 text-lg font-bold text-slate-900">No campuses found</h4>
                        <p className="text-sm text-slate-500">Get started by adding your first partner institution.</p>
                        <button
                            onClick={() => setIsFormVisible(true)}
                            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-700"
                        >
                            Add First Campus
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
