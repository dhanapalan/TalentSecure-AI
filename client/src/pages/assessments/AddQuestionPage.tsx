import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { ArrowLeft, BookOpen, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
    { id: "aptitude", name: "Aptitude" },
    { id: "technical", name: "Technical" },
    { id: "coding", name: "Coding" },
    { id: "communication", name: "Communication" },
    { id: "personality", name: "Personality" },
];

const DIFFICULTIES = [
    { id: "easy", name: "Easy" },
    { id: "medium", name: "Medium" },
    { id: "hard", name: "Hard" },
];

const TYPES = [
    { id: "mcq", name: "Multiple Choice (MCQ)" },
    { id: "text", name: "Text / Short Answer" },
    { id: "coding", name: "Coding" },
];

export default function AddQuestionPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [questionType, setQuestionType] = useState("mcq");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [correctOption, setCorrectOption] = useState("");

    const addMutation = useMutation({
        mutationFn: (payload: any) => api.post("/question-bank", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            toast.success("Question added to bank");
            navigate(-1);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Failed to add question");
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        const payload: any = {
            question_text: fd.get("question_text"),
            category: fd.get("category"),
            difficulty_level: fd.get("difficulty_level"),
            type: questionType,
        };

        if (questionType === "mcq") {
            const filledOptions = options.filter(o => o.trim());
            if (filledOptions.length < 2) {
                toast.error("Please provide at least 2 options");
                return;
            }
            if (!correctOption) {
                toast.error("Please select the correct answer");
                return;
            }
            payload.options = filledOptions;
            payload.correct_option = correctOption;
        }

        addMutation.mutate(payload);
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
                        <BookOpen className="h-7 w-7" /> Add Question
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold mt-1 uppercase tracking-wider">Add a new question to the global bank</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Question Type Selector */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Question Type</label>
                            <div className="flex gap-2">
                                {TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setQuestionType(t.id)}
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                                            questionType === t.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"
                                        }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Text */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Question Text</label>
                            <textarea
                                required
                                name="question_text"
                                rows={4}
                                placeholder="Enter the question text here..."
                                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    required
                                    name="category"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
                                <select
                                    required
                                    name="difficulty_level"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    {DIFFICULTIES.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* MCQ Options */}
                        {questionType === "mcq" && (
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Answer Options</label>
                                <div className="space-y-3">
                                    {options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="correct_option"
                                                checked={correctOption === opt && opt.trim() !== ""}
                                                onChange={() => opt.trim() && setCorrectOption(opt)}
                                                className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 flex-shrink-0"
                                                title="Mark as correct answer"
                                            />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const updated = [...options];
                                                    const wasCorrect = correctOption === options[i];
                                                    updated[i] = e.target.value;
                                                    setOptions(updated);
                                                    if (wasCorrect) setCorrectOption(e.target.value);
                                                }}
                                                placeholder={`Option ${i + 1}`}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 font-medium">Select the radio button next to the correct answer.</p>
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
                                disabled={addMutation.isPending}
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                {addMutation.isPending ? "Adding..." : "Add Question"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
