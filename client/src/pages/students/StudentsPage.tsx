import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  AcademicCapIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const campus = searchParams.get("campus");
    if (campus) setSearch(campus);
  }, [searchParams]);

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCollegeId, setBulkCollegeId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data } = await api.get("/students?limit=100");
      return data.data;
    },
  });

  // Fetch campuses (for editing/filtering)
  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return data.data;
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete student");
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/students/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully");
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update student");
    }
  });

  // Bulk Mutation
  const bulkMutation = useMutation({
    mutationFn: (data: { college_id: string; students: any[] }) => api.post("/students/bulk", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(res.data.message || "Bulk import successful");
      setIsBulkModalOpen(false);
      setBulkCollegeId("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Bulk import failed");
    },
    onSettled: () => setIsUploading(false)
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!bulkCollegeId) {
      toast.error("Please select a campus first");
      e.target.value = "";
      return;
    }

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

      const students = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const student: any = {};
        headers.forEach((header, i) => {
          if (header === "name" || header === "email" || header === "password") {
            student[header] = values[i];
          }
        });
        return student;
      }).filter(s => s.name && s.email);

      if (students.length === 0) {
        toast.error("No valid student data found in CSV");
        setIsUploading(false);
        return;
      }

      bulkMutation.mutate({ college_id: bulkCollegeId, students });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredStudents = students?.filter((s: any) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.college_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Talent Pool</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and oversee all registered students across campuses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
            Bulk Import
          </button>
          <Link to="/student/register" className="btn-primary flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Students</p>
              <p className="text-2xl font-black text-gray-900">{students?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, or campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FunnelIcon className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
            {filteredStudents?.length || 0} Results
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden p-0 border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Student Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Campus</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Academic Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">CGPA</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-gray-400">Loading student directory...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-gray-400">No students found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredStudents?.map((student: any) => (
                  <tr key={student.id} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img src={student.photo_url} className="h-10 w-10 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs font-bold text-indigo-600 mt-1">{student.roll_number || student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600">{student.college_name || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-gray-700">{student.major || "Not set"}</p>
                        <p className="text-gray-400 capitalize">{student.degree} • {student.graduation_year}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black",
                        student.cgpa >= 8 ? "bg-green-100 text-green-700" :
                          student.cgpa >= 6 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                      )}>
                        {student.cgpa?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Student Record</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              updateMutation.mutate({ ...data, id: editingStudent.id });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                  <input name="name" defaultValue={`${editingStudent.first_name} ${editingStudent.last_name}`} className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input name="email" defaultValue={editingStudent.email} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Campus</label>
                <select name="college_id" defaultValue={editingStudent.college_id} className="input-field shadow-sm">
                  {campuses?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Major</label>
                  <input name="major" defaultValue={editingStudent.major} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CGPA</label>
                  <input name="cgpa" type="number" step="0.01" defaultValue={editingStudent.cgpa} className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Student Import</h2>
                <p className="text-xs text-gray-500 mt-1">Upload student directory via CSV</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Campus</label>
                <select
                  value={bulkCollegeId}
                  onChange={(e) => setBulkCollegeId(e.target.value)}
                  className="w-full rounded-xl border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select a campus...</option>
                  {campuses?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={!bulkCollegeId || isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all",
                  bulkCollegeId ? "border-indigo-100 bg-indigo-50/30 group-hover:border-indigo-300 group-hover:bg-indigo-50" : "border-gray-100 bg-gray-50 opacity-50"
                )}>
                  {isUploading ? (
                    <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CloudArrowUpIcon className="h-10 w-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">Click to upload CSV</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">Expected: name, email, password</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                <div className="mt-0.5">⚠️</div>
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                  Ensure the CSV headers match exactly: "name", "email", and "password".
                  Duplicate emails will be automatically skipped.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-3xl border-t border-gray-100">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="w-full py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                Cancel Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
