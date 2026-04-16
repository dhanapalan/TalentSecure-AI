import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  Briefcase,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  Globe,
  Github,
  Linkedin,
  Target,
  BarChart3,
  ShieldAlert,
  File,
  Activity,
  AlertTriangle,
  Tag,
  Code2,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentData {
  id?: string;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;

  // Academic Information
  college_id: string;
  college_name: string;
  roll_number: string;
  degree: string;
  major: string;
  graduation_year: string;
  current_semester: string;
  cgpa: string;
  tenth_percentage: string;
  twelfth_percentage: string;
  active_backlogs: string;

  // Skills & Certifications
  technical_skills: string;
  programming_languages: string;
  tools_frameworks: string;
  certifications: string;

  // Experience & Projects
  internships: string;
  projects: string;

  // Assessment & Performance
  average_score: string;
  tests_taken: string;
  rank: string;

  // Placement Details
  placement_status: string;
  preferred_roles: string;
  expected_ctc: string;
  current_ctc: string;
  notice_period: string;
  open_to_relocate: boolean;

  // Documents
  resume_url: string;
  transcript_url: string;

  // Social Profiles
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;

  // Additional
  notes: string;
  tags: string;
  is_active: boolean;

  // Placement & Eligibility Tracking
  eligible_for_hiring: boolean;
  placed_company: string;
  placement_package: string;
  is_blacklisted: boolean;
  is_suspended: boolean;
  interview_status: string;
  is_shortlisted: boolean;
  offer_released: boolean;
  offer_accepted: boolean;
  has_joined: boolean;

  // Talent Intelligence & Segmentation
  segmentation_tags: string;
  avg_integrity_score: string;
  total_violations: string;
  risk_category: string;
}

type TabType = "overview" | "academic" | "skills" | "assessments" | "integrity" | "placement" | "documents" | "activity";

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Determine mode: new, edit, or view
  const isNew = !id || id === "new" || window.location.pathname.includes("/students/new");
  const isEditMode = isNew || window.location.pathname.endsWith("/edit");

  // Debug logging (remove in production)
  console.log("StudentDetailPage - id:", id, "isNew:", isNew, "isEditMode:", isEditMode, "pathname:", window.location.pathname);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<StudentData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "Male",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    college_id: "",
    college_name: "",
    roll_number: "",
    degree: "B.Tech",
    major: "",
    graduation_year: new Date().getFullYear().toString(),
    current_semester: "",
    cgpa: "",
    tenth_percentage: "",
    twelfth_percentage: "",
    active_backlogs: "0",
    technical_skills: "",
    programming_languages: "",
    tools_frameworks: "",
    certifications: "",
    internships: "",
    projects: "",
    average_score: "",
    tests_taken: "",
    rank: "",
    placement_status: "Open",
    preferred_roles: "",
    expected_ctc: "",
    current_ctc: "",
    notice_period: "",
    open_to_relocate: true,
    resume_url: "",
    transcript_url: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    notes: "",
    tags: "",
    is_active: true,
    eligible_for_hiring: true,
    placed_company: "",
    placement_package: "",
    is_blacklisted: false,
    is_suspended: false,
    interview_status: "",
    is_shortlisted: false,
    offer_released: false,
    offer_accepted: false,
    has_joined: false,
    segmentation_tags: "",
    avg_integrity_score: "",
    total_violations: "0",
    risk_category: "Low Risk",
  });

  // ── Fetch Student Data ──────────────────────────────────────────────────────

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${id}`);
      return (data as any).data;
    },
    enabled: !isNew,
  });

  // Fetch colleges for dropdown
  const { data: colleges = [] } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/campuses");
        return (data as any).data || [];
      } catch (err: any) {
        if (err.response?.status === 403) return [];
        throw err;
      }
    },
  });

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        email: student.email || "",
        phone: student.phone || "",
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || "Male",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "",
        pin_code: student.pin_code || "",
        college_id: student.college_id || "",
        college_name: student.college_name || "",
        roll_number: student.roll_number || "",
        degree: student.degree || "B.Tech",
        major: student.major || "",
        graduation_year: student.graduation_year?.toString() || "",
        current_semester: student.current_semester?.toString() || "",
        cgpa: student.cgpa?.toString() || "",
        tenth_percentage: student.tenth_percentage?.toString() || "",
        twelfth_percentage: student.twelfth_percentage?.toString() || "",
        active_backlogs: student.active_backlogs?.toString() || "0",
        technical_skills: student.technical_skills || "",
        programming_languages: student.programming_languages || "",
        tools_frameworks: student.tools_frameworks || "",
        certifications: student.certifications || "",
        internships: student.internships || "",
        projects: student.projects || "",
        average_score: student.average_score?.toString() || "",
        tests_taken: student.tests_taken?.toString() || "",
        rank: student.rank?.toString() || "",
        placement_status: student.placement_status || "Open",
        preferred_roles: student.preferred_roles || "",
        expected_ctc: student.expected_ctc?.toString() || "",
        current_ctc: student.current_ctc?.toString() || "",
        notice_period: student.notice_period || "",
        open_to_relocate: student.open_to_relocate ?? true,
        resume_url: student.resume_url || "",
        transcript_url: student.transcript_url || "",
        linkedin_url: student.linkedin_url || "",
        github_url: student.github_url || "",
        portfolio_url: student.portfolio_url || "",
        notes: student.notes || "",
        tags: student.tags || "",
        is_active: student.is_active ?? true,
        eligible_for_hiring: student.eligible_for_hiring ?? true,
        placed_company: student.placed_company || "",
        placement_package: student.placement_package?.toString() || "",
        is_blacklisted: student.is_blacklisted ?? false,
        is_suspended: student.is_suspended ?? false,
        interview_status: student.interview_status || "",
        is_shortlisted: student.is_shortlisted ?? false,
        offer_released: student.offer_released ?? false,
        offer_accepted: student.offer_accepted ?? false,
        has_joined: student.has_joined ?? false,
        segmentation_tags: Array.isArray(student.segmentation_tags) ? student.segmentation_tags.join(", ") : (student.segmentation_tags || ""),
        avg_integrity_score: student.avg_integrity_score?.toString() || "",
        total_violations: student.total_violations?.toString() || "0",
        risk_category: student.risk_category || "Low Risk",
      });
    }
  }, [student]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: StudentData) => api.post("/students", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student created successfully!");
      navigate("/app/students");
    },
    onError: (error: any) => {
      console.error("Create student error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to create student";
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: StudentData) => api.put(`/students/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", id] });
      toast.success("Student updated successfully!");
      navigate(`/app/students/${id}`);
    },
    onError: (error: any) => {
      console.error("Update student error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update student";
      toast.error(errorMsg);
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    // Validate required fields
    const requiredFields = [
      { field: 'first_name', label: 'First Name', tab: 'overview' },
      { field: 'last_name', label: 'Last Name', tab: 'overview' },
      { field: 'email', label: 'Email', tab: 'overview' },
    ];

    for (const { field, label, tab } of requiredFields) {
      if (!formData[field as keyof StudentData]) {
        toast.error(`${label} is required`);
        setActiveTab(tab as TabType);
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      setActiveTab("overview");
      return;
    }

    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof StudentData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Tab Configuration ───────────────────────────────────────────────────────

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: User },
    { id: "academic" as TabType, label: "Academic", icon: GraduationCap },
    { id: "skills" as TabType, label: "Skills & Development", icon: Code2 },
    { id: "assessments" as TabType, label: "Assessments", icon: BarChart3 },
    { id: "integrity" as TabType, label: "Integrity", icon: ShieldAlert },
    { id: "placement" as TabType, label: "Placement", icon: Target },
    { id: "documents" as TabType, label: "Documents", icon: File },
    { id: "activity" as TabType, label: "Activity Log", icon: Activity },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading student details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/app/students"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {isNew
                    ? "Add New Student"
                    : isEditMode
                      ? "Edit Student"
                      : "Student Details"}
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  {isNew
                    ? "Create a new student profile"
                    : isEditMode
                      ? "Update student information"
                      : student?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isNew && !isEditMode && (
                <Link
                  to={`/app/students/${id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700"
                >
                  <Save className="h-4 w-4" />
                  Edit Student
                </Link>
              )}

              {isEditMode && (
                <>
                  <button
                    onClick={() => navigate(isNew ? "/app/students" : `/app/students/${id}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : "Save Student"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === tab.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {isEditMode ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
            {/* Overview Tab (Merged Personal, Skills, Experience) */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-500">
                    Basic identity and contact details
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.first_name}
                      onChange={(e) => handleChange("first_name", e.target.value)}
                      placeholder="e.g., Rahul"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.last_name}
                      onChange={(e) => handleChange("last_name", e.target.value)}
                      placeholder="e.g., Sharma"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="rahul.sharma@college.edu"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange("date_of_birth", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Full residential address"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      City
                    </label>
                    <input
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="e.g., Mumbai"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      State
                    </label>
                    <input
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="e.g., Maharashtra"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      PIN Code
                    </label>
                    <input
                      value={formData.pin_code}
                      onChange={(e) => handleChange("pin_code", e.target.value)}
                      placeholder="400001"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === "academic" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Academic Information
                  </h2>
                  <p className="text-sm text-slate-500">
                    Educational background and performance
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      College/Campus
                    </label>
                    {colleges.length > 0 ? (
                      <select
                        value={formData.college_id}
                        onChange={(e) => {
                          const selectedCollege = colleges.find((c: any) => c.id === e.target.value);
                          handleChange("college_id", e.target.value);
                          if (selectedCollege) {
                            handleChange("college_name", selectedCollege.name);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select College</option>
                        {colleges.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={formData.college_name}
                        onChange={(e) => handleChange("college_name", e.target.value)}
                        placeholder="College Name"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Roll Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.roll_number}
                      onChange={(e) => handleChange("roll_number", e.target.value)}
                      placeholder="e.g., 2021CSE001"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Degree
                    </label>
                    <select
                      value={formData.degree}
                      onChange={(e) => handleChange("degree", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option>B.Tech</option>
                      <option>B.E.</option>
                      <option>B.Sc</option>
                      <option>BCA</option>
                      <option>M.Tech</option>
                      <option>M.E.</option>
                      <option>M.Sc</option>
                      <option>MCA</option>
                      <option>MBA</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Major/Branch
                    </label>
                    <input
                      value={formData.major}
                      onChange={(e) => handleChange("major", e.target.value)}
                      placeholder="e.g., Computer Science & Engineering"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      value={formData.graduation_year}
                      onChange={(e) => handleChange("graduation_year", e.target.value)}
                      placeholder="2025"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Current Semester
                    </label>
                    <input
                      type="number"
                      value={formData.current_semester}
                      onChange={(e) => handleChange("current_semester", e.target.value)}
                      placeholder="6"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cgpa}
                      onChange={(e) => handleChange("cgpa", e.target.value)}
                      placeholder="8.5"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      10th Percentage
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tenth_percentage}
                      onChange={(e) => handleChange("tenth_percentage", e.target.value)}
                      placeholder="90.5"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      12th Percentage
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.twelfth_percentage}
                      onChange={(e) => handleChange("twelfth_percentage", e.target.value)}
                      placeholder="88.0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Active Backlogs
                    </label>
                    <input
                      type="number"
                      value={formData.active_backlogs}
                      onChange={(e) => handleChange("active_backlogs", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Development Tab (edit mode) */}
            {activeTab === "skills" && (
              <div className="space-y-8">
                {/* Skills & Certifications */}
                <div className="space-y-5">
                  <div>
                    <h2 className="mb-1 text-lg font-black text-slate-900">Skills & Certifications</h2>
                    <p className="text-sm text-slate-500">Technical skills, languages, and certifications</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Technical Skills</label>
                    <textarea
                      value={formData.technical_skills}
                      onChange={(e) => handleChange("technical_skills", e.target.value)}
                      placeholder="e.g., Web Development, Mobile Development, Machine Learning, Data Structures, Algorithms"
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">Comma-separated skills</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Programming Languages</label>
                    <textarea
                      value={formData.programming_languages}
                      onChange={(e) => handleChange("programming_languages", e.target.value)}
                      placeholder="e.g., JavaScript, Python, Java, C++, TypeScript"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">Comma-separated languages</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Tools & Frameworks</label>
                    <textarea
                      value={formData.tools_frameworks}
                      onChange={(e) => handleChange("tools_frameworks", e.target.value)}
                      placeholder="e.g., React, Node.js, Django, TensorFlow, Docker, Git, AWS"
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">Comma-separated tools</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Certifications</label>
                    <textarea
                      value={formData.certifications}
                      onChange={(e) => handleChange("certifications", e.target.value)}
                      placeholder="e.g., AWS Certified Developer, Google Cloud Associate, Coursera Machine Learning"
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">List certifications with issuing authority</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <div>
                    <h2 className="mb-1 text-lg font-black text-slate-900">Experience & Projects</h2>
                    <p className="text-sm text-slate-500">Internships, work experience, and projects</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Internships & Work Experience</label>
                    <textarea
                      value={formData.internships}
                      onChange={(e) => handleChange("internships", e.target.value)}
                      placeholder="Example:&#10;• Software Development Intern at ABC Corp (Jun 2023 - Aug 2023)&#10;  - Developed REST APIs using Node.js&#10;  - Improved system performance by 30%"
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">List roles with company name, duration, and responsibilities</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Projects</label>
                    <textarea
                      value={formData.projects}
                      onChange={(e) => handleChange("projects", e.target.value)}
                      placeholder="Example:&#10;• E-commerce Platform (React, Node.js, MongoDB)&#10;  - Built full-stack shopping application&#10;  - Integrated payment gateway&#10;  - GitHub: github.com/user/project"
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">List projects with tech stack, description, and links</p>
                  </div>
                </div>
              </div>
            )}

            {/* Placement Tab */}
            {activeTab === "placement" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Placement Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Career preferences and placement status
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Placement Status
                    </label>
                    <select
                      value={formData.placement_status}
                      onChange={(e) => handleChange("placement_status", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option>Open</option>
                      <option>In Process</option>
                      <option>Offered</option>
                      <option>Placed</option>
                      <option>Not Interested</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Preferred Roles
                    </label>
                    <textarea
                      value={formData.preferred_roles}
                      onChange={(e) => handleChange("preferred_roles", e.target.value)}
                      placeholder="e.g., Software Engineer, Full Stack Developer, Backend Developer"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">Comma-separated roles</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Expected CTC (LPA)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.expected_ctc}
                      onChange={(e) => handleChange("expected_ctc", e.target.value)}
                      placeholder="6.0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Current CTC (if applicable)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.current_ctc}
                      onChange={(e) => handleChange("current_ctc", e.target.value)}
                      placeholder="4.5"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Notice Period (if working)
                    </label>
                    <input
                      value={formData.notice_period}
                      onChange={(e) => handleChange("notice_period", e.target.value)}
                      placeholder="e.g., 30 days, 60 days, Immediate"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Relocation Preference
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        id="open_to_relocate"
                        checked={formData.open_to_relocate}
                        onChange={(e) =>
                          handleChange("open_to_relocate", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <label
                        htmlFor="open_to_relocate"
                        className="text-sm font-bold text-slate-700"
                      >
                        Open to Relocate
                      </label>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="sm:col-span-2">
                    <h3 className="mb-3 text-sm font-black text-slate-800">Documents</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold text-slate-600">
                          Resume URL
                        </label>
                        <input
                          type="url"
                          value={formData.resume_url}
                          onChange={(e) => handleChange("resume_url", e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold text-slate-600">
                          Transcript URL
                        </label>
                        <input
                          type="url"
                          value={formData.transcript_url}
                          onChange={(e) => handleChange("transcript_url", e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Profiles */}
                  <div className="sm:col-span-2">
                    <h3 className="mb-3 text-sm font-black text-slate-800">
                      Social Profiles
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </label>
                        <input
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => handleChange("linkedin_url", e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Github className="h-3.5 w-3.5" /> GitHub
                        </label>
                        <input
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => handleChange("github_url", e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Globe className="h-3.5 w-3.5" /> Portfolio
                        </label>
                        <input
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => handleChange("portfolio_url", e.target.value)}
                          placeholder="https://yourportfolio.com"
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Tab */}
            {activeTab === "assessments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Assessment & Performance
                  </h2>
                  <p className="text-sm text-slate-500">
                    Test scores and assessment history
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Average Score
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.average_score}
                      onChange={(e) => handleChange("average_score", e.target.value)}
                      placeholder="85.5"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Tests Taken
                    </label>
                    <input
                      type="number"
                      value={formData.tests_taken}
                      onChange={(e) => handleChange("tests_taken", e.target.value)}
                      placeholder="12"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Overall Rank
                    </label>
                    <input
                      type="number"
                      value={formData.rank}
                      onChange={(e) => handleChange("rank", e.target.value)}
                      placeholder="25"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Detailed assessment history and analytics can be viewed
                    in the Analytics Dashboard once the student has taken assessments.
                  </p>
                </div>
              </div>
            )}

            {/* Additional Tab mapped to Activity Log */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-lg font-black text-slate-900">
                    Additional Information
                  </h2>
                  <p className="text-sm text-slate-500">Tags, notes, and account status</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Tags</label>
                    <input
                      value={formData.tags}
                      onChange={(e) => handleChange("tags", e.target.value)}
                      placeholder="e.g., Star-Performer, Quick-Learner, Team-Lead, Hackathon-Winner"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Comma-separated tags for internal categorization
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Internal Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="Internal notes, feedback from interviewers, special remarks, etc."
                      rows={6}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Account Status
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => handleChange("is_active", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <label
                        htmlFor="is_active"
                        className="text-sm font-bold text-slate-700"
                      >
                        Student is Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button (shown on all tabs) */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                onClick={() => navigate(isNew ? "/app/students" : `/app/students/${id}`)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isNew
                    ? "Create Student"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            {/* Student Overview Card — always visible */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
              style={{
                background: "linear-gradient(135deg, #FFF7ED 0%, #FEFCE8 100%)",
              }}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl font-black text-white shadow-lg">
                      {student?.first_name?.[0]?.toUpperCase()}
                      {student?.last_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">
                        {student?.name || `${student?.first_name} ${student?.last_name}`}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {student?.roll_number} • {student?.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${student?.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {student?.is_active ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {student?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {student?.placement_status && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                      <Target className="h-3 w-3" />
                      {student.placement_status}
                    </span>
                  )}
                  {student?.degree && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      <GraduationCap className="h-3 w-3" />
                      {student.degree} - {student.major}
                    </span>
                  )}
                  {student?.cgpa && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${student.cgpa >= 9
                        ? "bg-emerald-100 text-emerald-700"
                        : student.cgpa >= 7.5
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      <Award className="h-3 w-3" />
                      CGPA: {student.cgpa}
                    </span>
                  )}
                  {student?.segmentation_tags && student.segmentation_tags.length > 0 && (
                    student.segmentation_tags.split(',').map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-100/50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                        <Tag className="h-3 w-3" />
                        {tag.trim()}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Overview Tab ─────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <>
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { label: "CGPA", value: student?.cgpa || "N/A", icon: Award, color: "emerald" },
                    { label: "Tests Taken", value: student?.tests_taken || "0", icon: FileText, color: "blue" },
                    { label: "Avg Score", value: student?.average_score || "N/A", icon: TrendingUp, color: "violet" },
                    { label: "Grad Year", value: student?.graduation_year || "N/A", icon: Calendar, color: "amber" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.color}-100`}>
                        <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Details Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Personal Info */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800">Personal Information</h3>
                    <div className="space-y-3">
                      {student?.phone && <InfoRow icon={Phone} label="Phone" value={student.phone} />}
                      {student?.email && <InfoRow icon={Mail} label="Email" value={student.email} link />}
                      {student?.date_of_birth && <InfoRow icon={Calendar} label="Date of Birth" value={student.date_of_birth} />}
                      {student?.gender && <InfoRow icon={User} label="Gender" value={student.gender} />}
                      {student?.city && student?.state && (
                        <InfoRow icon={MapPin} label="Location" value={`${student.city}, ${student.state}`} />
                      )}
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800">Academic Details</h3>
                    <div className="space-y-3">
                      {student?.college_name && <InfoRow icon={GraduationCap} label="College" value={student.college_name} />}
                      {student?.degree && student?.major && <InfoRow icon={Award} label="Degree" value={`${student.degree} - ${student.major}`} />}
                      {student?.current_semester && <InfoRow icon={Calendar} label="Semester" value={`Semester ${student.current_semester}`} />}
                      {student?.tenth_percentage && <InfoRow icon={TrendingUp} label="10th %" value={`${student.tenth_percentage}%`} />}
                      {student?.twelfth_percentage && <InfoRow icon={TrendingUp} label="12th %" value={`${student.twelfth_percentage}%`} />}
                    </div>
                  </div>

                  {/* Skills summary — full details in Skills & Development tab */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-blue-500" /> Skills Summary
                    </h3>
                    {student?.technical_skills ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {student.technical_skills.split(",").slice(0, 5).map((skill: string, i: number) => (
                            <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{skill.trim()}</span>
                          ))}
                          {student.technical_skills.split(",").length > 5 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">+{student.technical_skills.split(",").length - 5} more</span>
                          )}
                        </div>
                        <button onClick={() => setActiveTab("skills")} className="text-xs font-bold text-blue-600 hover:underline">
                          View all skills & experience →
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">No skills listed yet.</p>
                    )}
                  </div>

                  {/* Social Links */}
                  {(student?.linkedin_url || student?.github_url || student?.portfolio_url) && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                      <h3 className="mb-4 text-sm font-black text-slate-800">Social Profiles</h3>
                      <div className="space-y-3">
                        {student?.linkedin_url && <InfoRow icon={Linkedin} label="LinkedIn" value={student.linkedin_url} link />}
                        {student?.github_url && <InfoRow icon={Github} label="GitHub" value={student.github_url} link />}
                        {student?.portfolio_url && <InfoRow icon={Globe} label="Portfolio" value={student.portfolio_url} link />}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Academic Tab ─────────────────────────────────────────────── */}
            {activeTab === "academic" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-4 text-sm font-black text-slate-800">Academic Performance</h3>
                  <div className="space-y-3">
                    {student?.college_name && <InfoRow icon={GraduationCap} label="College" value={student.college_name} />}
                    {student?.roll_number && <InfoRow icon={FileText} label="Roll Number" value={student.roll_number} />}
                    {student?.degree && <InfoRow icon={Award} label="Degree" value={`${student.degree} - ${student.major || ''}`} />}
                    {student?.graduation_year && <InfoRow icon={Calendar} label="Graduation Year" value={String(student.graduation_year)} />}
                    {student?.current_semester && <InfoRow icon={Calendar} label="Current Semester" value={String(student.current_semester)} />}
                    <InfoRow icon={Award} label="CGPA" value={student?.cgpa ? String(student.cgpa) : "N/A"} />
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-4 text-sm font-black text-slate-800">Pre-University Scores</h3>
                  <div className="space-y-3">
                    <InfoRow icon={TrendingUp} label="10th Percentage" value={student?.tenth_percentage ? `${student.tenth_percentage}%` : "N/A"} />
                    <InfoRow icon={TrendingUp} label="12th Percentage" value={student?.twelfth_percentage ? `${student.twelfth_percentage}%` : "N/A"} />
                    <InfoRow icon={AlertTriangle} label="Active Backlogs" value={student?.active_backlogs != null ? String(student.active_backlogs) : "0"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Skills & Development Tab ─────────────────────────────────── */}
            {activeTab === "skills" && (
              <div className="space-y-6">
                {/* Skills stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Technical Skills</p>
                    <p className="mt-1 text-2xl font-black text-blue-600">
                      {student?.technical_skills ? student.technical_skills.split(",").filter(Boolean).length : 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">skills listed</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Languages</p>
                    <p className="mt-1 text-2xl font-black text-violet-600">
                      {student?.programming_languages ? student.programming_languages.split(",").filter(Boolean).length : 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">languages</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certifications</p>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {student?.certifications ? student.certifications.split(",").filter(Boolean).length : 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">earned</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Technical Skills */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-blue-500" /> Technical Skills
                    </h3>
                    {student?.technical_skills ? (
                      <div className="flex flex-wrap gap-2">
                        {student.technical_skills.split(",").map((s: string, i: number) => s.trim() && (
                          <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{s.trim()}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400">No skills listed</p>}
                  </div>

                  {/* Programming Languages */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-violet-500" /> Programming Languages
                    </h3>
                    {student?.programming_languages ? (
                      <div className="flex flex-wrap gap-2">
                        {student.programming_languages.split(",").map((l: string, i: number) => l.trim() && (
                          <span key={i} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{l.trim()}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400">No languages listed</p>}
                  </div>

                  {/* Tools & Frameworks */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-amber-500" /> Tools & Frameworks
                    </h3>
                    {student?.tools_frameworks ? (
                      <div className="flex flex-wrap gap-2">
                        {student.tools_frameworks.split(",").map((t: string, i: number) => t.trim() && (
                          <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t.trim()}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400">No tools listed</p>}
                  </div>

                  {/* Certifications */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" /> Certifications
                    </h3>
                    {student?.certifications ? (
                      <div className="space-y-2">
                        {student.certifications.split(",").map((c: string, i: number) => c.trim() && (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="text-sm text-slate-700">{c.trim()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400">No certifications listed</p>}
                  </div>
                </div>

                {/* Experience */}
                {student?.internships && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-500" /> Internships & Work Experience
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{student.internships}</pre>
                  </div>
                )}

                {/* Projects */}
                {student?.projects && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500" /> Projects
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{student.projects}</pre>
                  </div>
                )}

                {!student?.technical_skills && !student?.programming_languages && !student?.certifications && !student?.internships && !student?.projects && (
                  <div className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-100 text-center">
                    <Code2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No skill development data yet</p>
                    <p className="text-xs text-slate-400 mt-1">Edit this profile to add skills, languages, tools, certifications, and projects.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Assessments Tab ──────────────────────────────────────────── */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Tests Taken", value: student?.tests_taken || "0", color: "blue" },
                    { label: "Average Score", value: student?.average_score ? `${student.average_score}%` : "N/A", color: "violet" },
                    { label: "Integrity Score", value: student?.avg_integrity_score ? `${student.avg_integrity_score}/100` : "N/A", color: "emerald" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                      <p className={`mt-1 text-2xl font-black text-${s.color}-600`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-4 text-sm font-black text-slate-800">Assessment History</h3>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="mb-3 h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Assessment history will appear here</p>
                    <p className="text-xs text-slate-400">Once assessments are assigned and completed, detailed results will be shown.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Integrity Tab ────────────────────────────────────────────── */}
            {activeTab === "integrity" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Category</p>
                    <p className={`mt-1 text-xl font-black ${student?.risk_category === "High Risk" ? "text-red-600" :
                      student?.risk_category === "Medium Risk" ? "text-amber-600" :
                        "text-emerald-600"
                      }`}>{student?.risk_category || "Low Risk"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Integrity Score</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{student?.avg_integrity_score ? `${student.avg_integrity_score}/100` : "N/A"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Violations</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{student?.total_violations || "0"}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-4 text-sm font-black text-slate-800">Integrity Log</h3>
                  <div className="space-y-3">
                    <InfoRow icon={ShieldAlert} label="Risk Category" value={student?.risk_category || "Low Risk"} />
                    <InfoRow icon={Activity} label="Avg Integrity Score" value={student?.avg_integrity_score ? `${student.avg_integrity_score}/100` : "N/A"} />
                    <InfoRow icon={AlertTriangle} label="Total Violations" value={student?.total_violations ? String(student.total_violations) : "0"} />
                    <InfoRow icon={CheckCircle} label="Blacklisted" value={student?.is_blacklisted ? "Yes" : "No"} />
                    <InfoRow icon={XCircle} label="Suspended" value={student?.is_suspended ? "Yes" : "No"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Placement Tab ────────────────────────────────────────────── */}
            {activeTab === "placement" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Eligible for Hiring</p>
                    <p className={`mt-1 text-xl font-black ${student?.eligible_for_hiring ? "text-emerald-600" : "text-red-600"}`}>
                      {student?.eligible_for_hiring ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Placement Status</p>
                    <p className="mt-1 text-xl font-black text-violet-600">{student?.placement_status || "Open"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Package</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{student?.placement_package ? `${student.placement_package} LPA` : "N/A"}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-4 text-sm font-black text-slate-800">Placement Journey</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Target} label="Placement Status" value={student?.placement_status || "Open"} />
                    {student?.placed_company && <InfoRow icon={Briefcase} label="Placed Company" value={student.placed_company} />}
                    {student?.placement_package && <InfoRow icon={Award} label="Package" value={`${student.placement_package} LPA`} />}
                    <InfoRow icon={CheckCircle} label="Shortlisted" value={student?.is_shortlisted ? "Yes" : "No"} />
                    <InfoRow icon={CheckCircle} label="Offer Released" value={student?.offer_released ? "Yes" : "No"} />
                    <InfoRow icon={CheckCircle} label="Offer Accepted" value={student?.offer_accepted ? "Yes" : "No"} />
                    <InfoRow icon={CheckCircle} label="Has Joined" value={student?.has_joined ? "Yes" : "No"} />
                    <InfoRow icon={XCircle} label="Blacklisted" value={student?.is_blacklisted ? "Yes" : "No"} />
                    <InfoRow icon={XCircle} label="Suspended" value={student?.is_suspended ? "Yes" : "No"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Documents Tab ────────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="mb-4 text-sm font-black text-slate-800">Documents & Links</h3>
                <div className="space-y-3">
                  <InfoRow icon={FileText} label="Resume" value={student?.resume_url || "Not uploaded"} link={!!student?.resume_url} />
                  <InfoRow icon={FileText} label="Transcript" value={student?.transcript_url || "Not uploaded"} link={!!student?.transcript_url} />
                  {student?.linkedin_url && <InfoRow icon={Linkedin} label="LinkedIn" value={student.linkedin_url} link />}
                  {student?.github_url && <InfoRow icon={Github} label="GitHub" value={student.github_url} link />}
                  {student?.portfolio_url && <InfoRow icon={Globe} label="Portfolio" value={student.portfolio_url} link />}
                </div>
              </div>
            )}

            {/* ── Activity Log Tab ─────────────────────────────────────────── */}
            {activeTab === "activity" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="mb-4 text-sm font-black text-slate-800">Activity Log</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Activity tracking coming soon</p>
                  <p className="text-xs text-slate-400">When enabled, you'll see login history, assessment events, and profile changes.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper Component ──────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: any;
  label: string;
  value: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {link ? (
          <a
            href={
              label === "Email"
                ? `mailto:${value}`
                : value.startsWith("http")
                  ? value
                  : `https://${value}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-800">{value}</p>
        )}
      </div>
    </div>
  );
}
