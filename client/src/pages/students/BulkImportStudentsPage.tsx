import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedStudent {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  college_id?: string;
  college_name?: string;
  roll_number: string;
  degree?: string;
  major?: string;
  graduation_year?: string;
  current_semester?: string;
  cgpa?: string;
  tenth_percentage?: string;
  twelfth_percentage?: string;
  active_backlogs?: string;
  technical_skills?: string;
  programming_languages?: string;
  tools_frameworks?: string;
  certifications?: string;
  internships?: string;
  projects?: string;
  placement_status?: string;
  preferred_roles?: string;
  expected_ctc?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BulkImportStudentsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // ── CSV Parsing ──────────────────────────────────────────────────────────────

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const students: ParsedStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const student: any = {};

      headers.forEach((header, index) => {
        student[header] = values[index] || "";
      });

      students.push(student);
    }

    return students;
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateStudents = (students: ParsedStudent[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    students.forEach((student, index) => {
      const rowNum = index + 2; // +2 because row 1 is header, and array is 0-indexed

      // Required fields
      if (!student.first_name) {
        errors.push({ row: rowNum, field: "first_name", message: "First name is required" });
      }
      if (!student.last_name) {
        errors.push({ row: rowNum, field: "last_name", message: "Last name is required" });
      }
      if (!student.email) {
        errors.push({ row: rowNum, field: "email", message: "Email is required" });
      } else if (!emailRegex.test(student.email)) {
        errors.push({ row: rowNum, field: "email", message: "Invalid email format" });
      }
      if (!student.roll_number) {
        errors.push({ row: rowNum, field: "roll_number", message: "Roll number is required" });
      }

      // Data type validation
      if (student.cgpa && (isNaN(Number(student.cgpa)) || Number(student.cgpa) > 10)) {
        errors.push({ row: rowNum, field: "cgpa", message: "CGPA must be a number ≤ 10" });
      }
      if (student.tenth_percentage && (isNaN(Number(student.tenth_percentage)) || Number(student.tenth_percentage) > 100)) {
        errors.push({ row: rowNum, field: "tenth_percentage", message: "10th % must be ≤ 100" });
      }
      if (student.twelfth_percentage && (isNaN(Number(student.twelfth_percentage)) || Number(student.twelfth_percentage) > 100)) {
        errors.push({ row: rowNum, field: "twelfth_percentage", message: "12th % must be ≤ 100" });
      }
    });

    return errors;
  };

  // ── File Upload Handler ──────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setParsedData([]);
    setValidationErrors([]);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);

      const errors = validateStudents(parsed);
      setValidationErrors(errors);

      if (errors.length === 0) {
        toast.success(`${parsed.length} students validated successfully!`);
      } else {
        toast.error(`Found ${errors.length} validation errors`);
      }
    } catch (error) {
      toast.error("Failed to parse CSV file");
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  // ── Bulk Import Mutation ─────────────────────────────────────────────────────

  const bulkImportMutation = useMutation({
    mutationFn: async (students: ParsedStudent[]) => {
      // Import in batches of 10
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const promises = batch.map((student) => api.post("/students", student));

        try {
          const batchResults = await Promise.allSettled(promises);
          results.push(...batchResults);
          setImportProgress(Math.round(((i + batch.length) / students.length) * 100));
        } catch (error) {
          console.error("Batch import error:", error);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      qc.invalidateQueries({ queryKey: ["students"] });

      if (failed === 0) {
        toast.success(`Successfully imported ${successful} students!`);
        navigate("/app/students");
      } else {
        toast.error(`Imported ${successful} students, ${failed} failed`);
      }
    },
    onError: (error) => {
      console.error("Bulk import error:", error);
      toast.error("Failed to import students");
    },
  });

  // ── Download Sample CSV ──────────────────────────────────────────────────────

  const downloadSampleCSV = () => {
    const sampleCSV = `first_name,last_name,email,phone,date_of_birth,gender,roll_number,degree,major,graduation_year,current_semester,cgpa,tenth_percentage,twelfth_percentage,active_backlogs,college_name,city,state,technical_skills,programming_languages,placement_status
Rahul,Sharma,rahul.sharma@college.edu,+91 98765 43210,2003-05-15,Male,2021CSE001,B.Tech,Computer Science,2025,6,8.5,92,88,0,Anna University,Chennai,Tamil Nadu,Python|Java|React,Python|Java|JavaScript,Open
Priya,Kumar,priya.kumar@college.edu,+91 98765 43211,2003-08-22,Female,2021CSE002,B.Tech,Computer Science,2025,6,9.2,95,90,0,Anna University,Chennai,Tamil Nadu,Machine Learning|Python,Python|R|SQL,Open
Arjun,Patel,arjun.patel@college.edu,+91 98765 43212,2003-03-10,Male,2021CSE003,B.Tech,Computer Science,2025,6,8.8,90,87,1,IIT Bombay,Mumbai,Maharashtra,Full Stack Development,JavaScript|Node.js|React,Open
Sneha,Reddy,sneha.reddy@college.edu,+91 98765 43213,2003-11-05,Female,2021CSE004,B.Tech,Computer Science,2025,6,9.5,98,95,0,IIT Bombay,Mumbai,Maharashtra,Data Science|AI,Python|TensorFlow|PyTorch,Open
Vikram,Singh,vikram.singh@college.edu,+91 98765 43214,2003-07-18,Male,2021CSE005,B.Tech,Information Technology,2025,6,8.0,85,82,0,NIT Trichy,Trichy,Tamil Nadu,Web Development|Cloud,JavaScript|AWS|Docker,Open`;

    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_students_import.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Sample CSV downloaded!");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasErrors = validationErrors.length > 0;
  const canImport = parsedData.length > 0 && !hasErrors && !bulkImportMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/app/students"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Bulk Import Students
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Upload a CSV file to import multiple students at once
                </p>
              </div>
            </div>

            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Sample CSV
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
            <div className="mb-6">
              <h2 className="mb-1 text-lg font-black text-slate-900">
                Upload CSV File
              </h2>
              <p className="text-sm text-slate-500">
                Select a CSV file containing student data. Download the sample CSV to see the required format.
              </p>
            </div>

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={bulkImportMutation.isPending}
              />
              <label
                htmlFor="csv-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 transition-all hover:border-blue-300 hover:bg-blue-50/30"
              >
                <Upload className="mb-4 h-12 w-12 text-slate-400" />
                <p className="mb-2 text-sm font-bold text-slate-700">
                  {file ? file.name : "Click to upload CSV file"}
                </p>
                <p className="text-xs text-slate-500">
                  or drag and drop your file here
                </p>
              </label>
            </div>

            {isValidating && (
              <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-bold text-blue-700">
                  Validating CSV data...
                </span>
              </div>
            )}
          </div>

          {/* Validation Results */}
          {file && !isValidating && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Validation Results
                  </h2>
                  <p className="text-sm text-slate-500">
                    {parsedData.length} students found in CSV
                  </p>
                </div>

                {!hasErrors && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700">
                      All Valid
                    </span>
                  </div>
                )}
              </div>

              {/* Error Summary */}
              {hasErrors && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">
                      Found {validationErrors.length} Validation Errors
                    </h3>
                  </div>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {validationErrors.map((error, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <div>
                          <span className="font-bold text-red-900">
                            Row {error.row}:
                          </span>{" "}
                          <span className="text-slate-700">
                            {error.field} - {error.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {parsedData.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-700">
                    Data Preview (First 5 rows)
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-700">Name</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Email</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Roll No</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Degree</th>
                          <th className="px-4 py-3 font-bold text-slate-700">CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 5).map((student, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.email}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.roll_number}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.degree || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.cgpa || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 5 && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      ...and {parsedData.length - 5} more students
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          {canImport && (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm ring-1 ring-blue-100 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-black text-slate-900">
                    Ready to Import
                  </h3>
                  <p className="text-sm text-slate-600">
                    {parsedData.length} students will be added to the system
                  </p>
                </div>
              </div>

              <button
                onClick={() => bulkImportMutation.mutate(parsedData)}
                disabled={!canImport}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                Import {parsedData.length} Students
              </button>
            </div>
          )}

          {/* Import Progress */}
          {bulkImportMutation.isPending && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div>
                    <h3 className="font-black text-slate-900">Importing Students...</h3>
                    <p className="text-sm text-slate-600">
                      Please wait while we process your data
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-600">
                  {importProgress}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-100 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">CSV Format Instructions</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                <span>
                  <strong>Required fields:</strong> first_name, last_name, email, roll_number
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                <span>Use comma (,) as the separator between fields</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                <span>First row must contain column headers (field names)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                <span>For multiple values in a field (like skills), use pipe (|) separator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                <span>Download the sample CSV to see the exact format</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
