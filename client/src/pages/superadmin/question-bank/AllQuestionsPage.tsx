import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlassIcon, PlusIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import StatusBadge from "../../../components/superadmin/StatusBadge";
import questionBankService, { Question } from "../../../services/questionBankService";

export default function AllQuestionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await questionBankService.searchQuestions(
          search || undefined,
          categoryFilter === "all" ? undefined : categoryFilter,
          difficultyFilter === "all" ? undefined : difficultyFilter
        );
        setQuestions(data.questions);
      } catch (error) {
        toast.error("Failed to load questions");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [search, categoryFilter, difficultyFilter]);

  const filtered = useMemo(() => {
    return questions;
  }, [questions]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Questions</h2>
          <p className="text-gray-600 mt-1">Manage the master question repository ({questions.length} total)</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions, topics, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Groups */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="aptitude">Aptitude</option>
                <option value="reasoning">Reasoning</option>
                <option value="maths">Maths</option>
                <option value="data_structures">Data Structures</option>
                <option value="programming">Programming</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Question</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tags</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="max-w-xs truncate">{question.question_text}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="capitalize">{question.category.replace(/[-_]/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        status={
                          question.difficulty_level === "easy"
                            ? "success"
                            : question.difficulty_level === "hard"
                              ? "error"
                              : "pending"
                        }
                        label={
                          question.difficulty_level.charAt(0).toUpperCase() +
                          question.difficulty_level.slice(1)
                        }
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {question.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(question.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        status={question.status === "published" ? "active" : "pending"}
                        label={question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 mr-3">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-600">No questions found matching your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
