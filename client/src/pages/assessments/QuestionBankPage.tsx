import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import api from "../../lib/api";
import {
    MagnifyingGlassIcon,
    PencilSquareIcon,
    CloudArrowUpIcon,
    CheckCircleIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export default function QuestionBankPage({ isStudioView }: { isStudioView?: boolean }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    // Fetch Questions
    const { data: questions, isLoading } = useQuery({
        queryKey: ["questions", filterCategory, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCategory) params.append("category", filterCategory);
            if (search) params.append("search", search);
            const { data } = await api.get(`/question-bank?${params.toString()}`);
            return data.data;
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/question-bank/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            toast.success("Question deleted from bank");
        },
    });

    const categories = [
        { id: "aptitude", name: "Aptitude" },
        { id: "technical", name: "Technical" },
        { id: "coding", name: "Coding" },
        { id: "communication", name: "Communication" },
        { id: "personality", name: "Personality" },
    ];

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {!isStudioView && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Question Bank</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage the global pool of assessment questions across all categories.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                            <CloudArrowUpIcon className="h-5 w-5 text-gray-400" />
                            Bulk Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/app/assessments/bank/new")}
                            className="btn-primary flex items-center gap-2"
                        >
                            <div className="h-5 w-5 border-2 border-white rounded-md flex items-center justify-center font-black text-xs">+</div>
                            Add Question
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="card bg-white border-gray-100 hover:border-indigo-100 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{cat.name}</p>
                                <p className="text-xl font-black text-gray-900 mt-1">
                                    {questions?.filter((q: any) => q.category === cat.id).length || 0}
                                </p>
                            </div>
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-row gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-gray-50 border-none rounded-lg text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all px-4"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="hidden sm:block">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
                        {questions?.length || 0} Pool Questions
                    </span>
                </div>
            </div>

            {/* Questions List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Accessing Vault...</p>
                    </div>
                ) : questions?.length === 0 ? (
                    <div className="card py-20 text-center border-dashed border-2 border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No questions found in this sector</p>
                    </div>
                ) : (
                    questions?.map((q: any) => (
                        <div key={q.id} className="card group hover:shadow-md transition-all border-gray-100 hover:border-indigo-100">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                            q.difficulty_level === "easy" ? "bg-green-100 text-green-700" :
                                                q.difficulty_level === "medium" ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                        )}>
                                            {q.difficulty_level}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                                            {q.category}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                                            {q.type}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                        {q.question_text}
                                    </p>

                                    {q.type === "mcq" && q.options && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                            {q.options.map((opt: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-lg border text-xs font-medium flex items-center justify-between",
                                                        q.correct_option === opt ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-100 text-gray-600"
                                                    )}
                                                >
                                                    <span>{opt}</span>
                                                    {q.correct_option === opt && <CheckCircleIcon className="h-4 w-4" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
