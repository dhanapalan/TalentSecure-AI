import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import questionBankService from "../../../services/questionBankService";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  question_count: number;
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  questionCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await questionBankService.getCategories();
        setCategories(data);
      } catch (error) {
        toast.error("Failed to load categories");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const category = await questionBankService.createCategory(
        newCategory.name,
        newCategory.description
      );
      setCategories([...categories, category]);
      setNewCategory({ name: "", description: "" });
      setShowAddForm(false);
      toast.success("Category added successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add category");
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await questionBankService.deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete category");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Categories & Topics</h2>
          <p className="text-gray-600 mt-1">Manage question taxonomy and topics</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Category</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Aptitude, Reasoning, Technical"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of this category"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <p className="text-gray-600">Loading categories...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                <p className="text-xs text-gray-500 mt-2">{category.question_count ?? 0} questions</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Topics */}
            {(category.topics?.length ?? 0) > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Topics ({category.topics!.length})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {category.topics!.map((topic) => (
                    <div key={topic.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                        <p className="text-xs text-gray-500">{topic.questionCount} questions</p>
                      </div>
                      <button className="text-red-500 hover:text-red-700">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
