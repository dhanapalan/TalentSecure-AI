import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Award,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  FileText,
  Save,
  Lock,
  UserCheck,
  BookOpen,
  TrendingUp,
  Upload,
  Plus,
  Key,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CampusDetails {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  website: string;
  tier: string;
  campus_type: string;

  // Stats
  student_count: number;
  admin_count: number;
  assessments_count: number;
  avg_score: number;
  avg_risk_score: number;
  incident_count: number;

  stats?: any;
  admins?: any[];

  college_code: string;
  is_active: boolean;

  // Eligibility
  is_suspended: boolean;
  eligible_for_hiring: boolean;
  eligible_for_tier1: boolean;
  is_blacklisted: boolean;

  // Classification
  category: string;
  institution_type: string;
  region: string;
  naac_grade: string;
  nirf_rank: number | null;

  // Agreement
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  mou_status: string;
  sla: string;
  mou_url: string | null;
  contract_status: string;

  // Contact
  contact_email: string;
  contact_phone: string;

  internal_notes: string;
  created_at: string;
  last_activity_date: string | null;

  // For New Campus Creation
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

type TabType = "overview" | "admins" | "students" | "assessments" | "performance" | "integrity" | "agreements";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampusDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = window.location;
  const isNew = id === "new";
  const isEditRoute = location.pathname.endsWith("/edit");

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<Partial<CampusDetails>>({});
  const [isEditingParams, setIsEditingParams] = useState(isNew || isEditRoute);

  // Invite Admin State
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [inviteAdminForm, setInviteAdminForm] = useState({ name: "", email: "", password: "" });

  // MOU Upload State
  const [uploadingMou, setUploadingMou] = useState(false);
  const mouInputRef = useRef<HTMLInputElement>(null);

  // ── Fetching ────────────────────────────────────────────────────────────────

  const { data: campus, isLoading } = useQuery({
    queryKey: ["campus", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await api.get(`/campuses/${id}`);
      return data.data as CampusDetails;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (campus && !isNew) {
      setFormData(campus);
      setIsEditingParams(isEditRoute);
    } else if (isNew) {
      setIsEditingParams(true);
      setFormData({
        tier: "Tier 1",
        campus_type: "Engineering",
        is_active: true,
      });
    }
  }, [campus, isNew]);

  const createMutation = useMutation({
    mutationFn: (body: Partial<CampusDetails>) => api.post(`/campuses`, body),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus created successfully!");
      // Redirect to the newly created campus
      navigate(`/app/campuses/${res.data.data.id}`);
    },
    onError: () => toast.error("Failed to create campus"),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Partial<CampusDetails>) => api.put(`/campuses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campus", id] });
      qc.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus updated successfully!");
      setIsEditingParams(false);
      if (isEditRoute) {
        navigate(`/app/campuses/${id}`);
      }
    },
    onError: () => toast.error("Failed to update campus"),
  });

  const inviteAdminMutation = useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) => api.post(`/campuses/${id}/admins`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campus", id] });
      toast.success("Admin invited successfully!");
      setShowInviteAdmin(false);
      setInviteAdminForm({ name: "", email: "", password: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to invite admin");
    }
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const handleToggle = (field: keyof CampusDetails) => {
    if (isNew) {
      handleChange(field, !formData[field]);
    } else {
      updateMutation.mutate({ [field]: !formData[field] } as any);
    }
  };

  const handleChange = (field: keyof CampusDetails, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    inviteAdminMutation.mutate(inviteAdminForm);
  };

  const handleMouUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!id || id === "new") {
      toast.error("Please save the campus details before uploading documents");
      return;
    }

    const form = new FormData();
    form.append("mou_file", file);
    setUploadingMou(true);

    try {
      const res = await api.post(`/campuses/${id}/upload-mou`, form);
      const url = res.data.data.mou_url;
      setFormData((prev) => ({ ...prev, mou_url: url }));
      qc.invalidateQueries({ queryKey: ["campus", id] });
      toast.success("MOU document uploaded successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploadingMou(false);
      if (mouInputRef.current) mouInputRef.current.value = "";
    }
  };

  const getRiskBadge = (score: number) => {
    if (score > 50) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20"><ShieldAlert className="h-4 w-4" /> High Risk</span>;
    if (score > 20) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20"><AlertTriangle className="h-4 w-4" /> Moderate Risk</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><ShieldCheck className="h-4 w-4" /> Low Risk</span>;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading && !isNew) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading Enterprise Data...</p>
        </div>
      </div>
    );
  }

  // Safe fallback if not loaded
  const details = isEditingParams ? formData : campus || formData;

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Building2 },
    { id: "admins" as TabType, label: "Admins", icon: Users },
    { id: "students" as TabType, label: "Students", icon: UserCheck },
    { id: "assessments" as TabType, label: "Assessments", icon: BookOpen },
    { id: "performance" as TabType, label: "Performance", icon: TrendingUp },
    { id: "integrity" as TabType, label: "Integrity", icon: Activity },
    { id: "agreements" as TabType, label: "Agreements", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* ── Header Area ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/app/campuses" className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  {isEditingParams ? (
                    <input
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter Campus Name"
                      className="text-2xl font-black text-slate-900 tracking-tight bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none placeholder:text-slate-300"
                    />
                  ) : (
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {details.name || "Unnamed Campus"}
                    </h1>
                  )}
                  {details.is_suspended && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      Suspended
                    </span>
                  )}
                  {details.is_blacklisted && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                      Blacklisted
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {isEditingParams ? (
                      <div className="flex gap-2">
                        <input required placeholder="City" value={formData.city || ""} onChange={(e) => handleChange("city", e.target.value)} className="w-24 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                        ,
                        <input required placeholder="State" value={formData.state || ""} onChange={(e) => handleChange("state", e.target.value)} className="w-24 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                      </div>
                    ) : (
                      <>{details.city || "City"}, {details.state || "State"}</>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    {details.tier || "Unassigned Tier"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Key className="h-4 w-4" />
                    {details.college_code}
                  </div>
                  {getRiskBadge(details.avg_risk_score || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditingParams ? (
                <>
                  <button onClick={() => {
                    setIsEditingParams(false);
                    setFormData(campus || {});
                    if (isEditRoute) {
                      navigate(`/app/campuses/${id}`);
                    }
                  }} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={!(formData.name && formData.city && formData.state) || (isNew && !(formData.adminName && formData.adminEmail && formData.adminPassword)) || updateMutation.isPending || createMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending || createMutation.isPending ? "Saving..." : isNew ? "Create Campus" : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setFormData(campus || {});
                    setIsEditingParams(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                  Edit Parameters
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ======================= OVERVIEW TAB ======================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick KPI Row */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {[
                { label: "Students", val: details.stats?.student_count ?? details.student_count ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Admins", val: details.admins?.length ?? details.admin_count ?? 0, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Assessments", val: details.stats?.assessments_count ?? details.assessments_count ?? 0, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Avg Score", val: `${(details.stats?.avg_score ?? details.avg_score ?? 0).toFixed(1)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Integrity", val: `${(100 - (details.stats?.avg_risk_score ?? details.avg_risk_score ?? 0)).toFixed(1)}%`, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Incidents", val: details.stats?.violation_count ?? details.incident_count ?? 0, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
              ].map((kpi, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
                  <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{kpi.label}</p>
                    <p className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${kpi.color}`}>{kpi.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* General Information */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2"><Building2 className="text-blue-600 h-5 w-5" /> General Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Institution Type</span>
                    {isEditingParams ? (
                      <input value={formData.institution_type || ""} onChange={(e) => handleChange("institution_type", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Institution type" aria-label="Institution type" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.institution_type || "—"}</span>)}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</span>
                    {isEditingParams ? (
                      <input value={formData.category || ""} onChange={(e) => handleChange("category", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Category" aria-label="Category" title="Category" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.category || "—"}</span>)}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NAAC Grade</span>
                    {isEditingParams ? (
                      <input value={formData.naac_grade || ""} onChange={(e) => handleChange("naac_grade", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="NAAC grade" aria-label="NAAC grade" title="NAAC grade" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.naac_grade ? `NAAC ${details.naac_grade}` : "—"}</span>)}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NIRF Rank</span>
                    {isEditingParams ? (
                      <input type="number" value={formData.nirf_rank || ""} onChange={(e) => handleChange("nirf_rank", parseInt(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="NIRF rank" aria-label="NIRF rank" title="NIRF rank" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.nirf_rank || "—"}</span>)}
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</span>
                    {isEditingParams ? (
                      <textarea rows={2} required value={formData.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Address" aria-label="Address" title="Address" />
                    ) : (<span className="text-sm font-medium text-slate-700">{details.address || `${details.city}, ${details.state}`}</span>)}
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><FileText className="text-violet-600 h-5 w-5" /> Internal Notes (Admin Only)</h3>
                {isEditingParams ? (
                  <textarea rows={4} value={formData.internal_notes || ""} onChange={(e) => handleChange("internal_notes", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Jot down notes, feedback, or internal context about this relationship..." />
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 min-h-[100px] text-sm text-slate-600 whitespace-pre-wrap">
                    {details.internal_notes ? details.internal_notes : <span className="italic text-slate-400">No internal notes added yet.</span>}
                  </div>
                )}
              </div>

              {/* Initial Admin Details (Only when creating new) */}
              {isNew && (
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 border-l-4 border-l-blue-500">
                  <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                    <UserCheck className="text-blue-600 h-5 w-5" />
                    Initial Campus Administrator
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">
                    An initial administrator is required to set up the campus account. They will receive an email invitation to log in.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Admin Full Name <span className="text-red-500">*</span></span>
                      <input
                        value={formData.adminName || ""}
                        onChange={(e) => handleChange("adminName" as any, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Admin Email <span className="text-red-500">*</span></span>
                      <input
                        type="email"
                        value={formData.adminEmail || ""}
                        onChange={(e) => handleChange("adminEmail" as any, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="admin@campus.edu"
                        required
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Temporary Password <span className="text-red-500">*</span></span>
                      <input
                        type="password"
                        value={formData.adminPassword || ""}
                        onChange={(e) => handleChange("adminPassword" as any, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Eligibility & Triggers */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 bg-gradient-to-br from-white to-slate-50">
                <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2"><Lock className="text-slate-700 h-5 w-5" /> Campus Eligibility Control</h3>
                <div className="space-y-4">

                  {/* Toggle: Eligible for Hiring */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-100 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Eligible for Hiring</p>
                      <p className="text-xs text-slate-500">Allow recruitment drives automatically</p>
                    </div>
                    <button
                      onClick={() => handleToggle("eligible_for_hiring")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${details.eligible_for_hiring ? "bg-emerald-500" : "bg-slate-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${details.eligible_for_hiring ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Toggle: Tier 1 Exclusive */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-100 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Tier 1 Exclusivity</p>
                      <p className="text-xs text-slate-500">Enable premium assessments & features</p>
                    </div>
                    <button
                      onClick={() => handleToggle("eligible_for_tier1")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${details.eligible_for_tier1 ? "bg-blue-600" : "bg-slate-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${details.eligible_for_tier1 ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Toggle: Suspended */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-amber-200 shadow-sm bg-amber-50/50">
                    <div>
                      <p className="text-sm font-bold text-amber-900">Temporarily Suspended</p>
                      <p className="text-xs text-amber-700">Pause all active assessments & access</p>
                    </div>
                    <button
                      onClick={() => handleToggle("is_suspended")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${details.is_suspended ? "bg-amber-500" : "bg-slate-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${details.is_suspended ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Toggle: Blacklisted */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-red-200 shadow-sm bg-red-50/50">
                    <div>
                      <p className="text-sm font-bold text-red-900">Blacklist Campus</p>
                      <p className="text-xs text-red-700">Permanent ban from ecosystem</p>
                    </div>
                    <button
                      onClick={() => handleToggle("is_blacklisted")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${details.is_blacklisted ? "bg-red-600" : "bg-slate-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${details.is_blacklisted ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= ADMINS TAB ======================= */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Campus Administrators</h3>
                <p className="text-sm text-slate-500">Manage individuals with access to this campus's data and coordination tools.</p>
              </div>
              <button
                onClick={() => setShowInviteAdmin(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-600/20"
              >
                <Plus className="h-4 w-4" /> Invite new Admin
              </button>
            </div>

            {showInviteAdmin && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-blue-200 border border-blue-100 p-6 relative">
                <button
                  onClick={() => setShowInviteAdmin(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Invite Administrator
                </h4>
                <form onSubmit={handleInviteAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      required
                      value={inviteAdminForm.name}
                      onChange={(e) => setInviteAdminForm(curr => ({ ...curr, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={inviteAdminForm.email}
                      onChange={(e) => setInviteAdminForm(curr => ({ ...curr, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="admin@campus.edu"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="password"
                        value={inviteAdminForm.password}
                        onChange={(e) => setInviteAdminForm(curr => ({ ...curr, password: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Min 6 chars"
                      />
                      <button
                        type="submit"
                        disabled={inviteAdminMutation.isPending || !inviteAdminForm.name || !inviteAdminForm.email || !inviteAdminForm.password}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                      >
                        {inviteAdminMutation.isPending ? "Inviting..." : "Send Invite"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name & Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Login</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(campus as any)?.admins?.length > 0 ? (
                    (campus as any).admins.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{admin.name}</div>
                          <div className="text-slate-500 text-xs">{admin.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                            {admin.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {admin.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {/* Add quick actions like reset password or disable here */}
                          <button className="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 bg-slate-50/30">
                        No administrators assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= STUDENTS TAB ======================= */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Enrolled Students</h3>
                <p className="text-sm text-slate-500">Directory of students registered from this campus.</p>
              </div>
              <Link to={`/app/students?campus_id=${id}`} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                View Full Student Directory
              </Link>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-8 text-center text-slate-500 border border-dashed border-slate-300">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Detailed Student View Coming Soon</h4>
              <p className="text-sm mt-1">Navigate to the main students directory to filter by this campus.</p>
            </div>
          </div>
        )}

        {/* ======================= ASSESSMENTS TAB ======================= */}
        {activeTab === "assessments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assessment History</h3>
                <p className="text-sm text-slate-500">Exams conducted, scheduled, and assigned to this campus.</p>
              </div>
              <button onClick={() => navigate("/app/drives/new")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm">
                Assign New Assessment
              </button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-8 text-center text-slate-500 border border-dashed border-slate-300">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Detailed Exam History Coming Soon</h4>
              <p className="text-sm mt-1">View comprehensive statistics of all past exams.</p>
            </div>
          </div>
        )}

        {/* ======================= PERFORMANCE TAB ======================= */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900">Performance Analytics</h3>
            <p className="text-sm text-slate-500">Distribution of scores, pass percentages, and top percentile performers.</p>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-8 text-center text-slate-500 border border-dashed border-slate-300">
              <TrendingUp className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Advanced Analytics Dashboard Being Built</h4>
              <p className="text-sm mt-1">Graphs and charts detailing campus-wide performance will appear here.</p>
            </div>
          </div>
        )}

        {/* ======================= INTEGRITY TAB ======================= */}
        {activeTab === "integrity" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Trust & Integrity Monitoring</h3>
                <p className="text-sm text-slate-500">Proctoring incidents, browser violations, and detailed risk analysis.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Overall Integrity Snapshot</h4>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                    <span className="text-lg font-black text-emerald-700">{100 - (details.stats?.avg_risk_score ?? details.avg_risk_score ?? 0)}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Excellent Integrity</p>
                    <p className="text-xs text-slate-500 mt-1">Based on thousands of secure assessments.</p>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Recent Flagged Incidents</h4>
                <div className="text-center py-6 text-slate-400">
                  <ShieldCheck className="mx-auto h-8 w-8 text-emerald-300 mb-2" />
                  <p className="text-sm">No critical incidents recently.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= AGREEMENTS TAB ======================= */}
        {activeTab === "agreements" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900">Enterprise Contracts & SLA</h3>
            <p className="text-sm text-slate-500">Manage legal agreements, MOUs, and custom Service Level Agreements.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Side */}
              <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contract Status</span>
                    {isEditingParams ? (
                      <select value={formData.contract_status || "Active"} onChange={(e) => handleChange("contract_status", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Contract status">
                        <option>Active</option>
                        <option>Pending Signature</option>
                        <option>Expired</option>
                        <option>Negotiating</option>
                        <option>Terminated</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${details.contract_status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{details.contract_status || "Active"}</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Level Agreement (SLA)</span>
                    {isEditingParams ? (
                      <input value={formData.sla || ""} onChange={(e) => handleChange("sla", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 99.9% Uptime guarantee" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.sla || "Standard Corporate SLA"}</span>)}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Agreement Start Date</span>
                    {isEditingParams ? (
                      <input type="date" value={formData.agreement_start_date ? new Date(formData.agreement_start_date).toISOString().split('T')[0] : ""} onChange={(e) => handleChange("agreement_start_date", new Date(e.target.value).toISOString())} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Agreement start date" aria-label="Agreement start date" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.agreement_start_date ? new Date(details.agreement_start_date).toLocaleDateString() : "—"}</span>)}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Agreement End Date</span>
                    {isEditingParams ? (
                      <input type="date" value={formData.agreement_end_date ? new Date(formData.agreement_end_date).toISOString().split('T')[0] : ""} onChange={(e) => handleChange("agreement_end_date", new Date(e.target.value).toISOString())} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Agreement end date" aria-label="Agreement end date" />
                    ) : (<span className="text-sm font-semibold text-slate-800">{details.agreement_end_date ? new Date(details.agreement_end_date).toLocaleDateString() : "—"}</span>)}
                  </div>
                </div>
              </div>

              {/* Upload PDF Side */}
              <div className="col-span-1 rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200 p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">MOU Document</h4>
                <p className="text-xs text-slate-400 text-center mt-1 mb-4">Upload the signed contract PDF for reference.</p>
                {formData.mou_url && (
                  <a
                    href={formData.mou_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Current Document
                  </a>
                )}

                <button
                  onClick={() => mouInputRef.current?.click()}
                  disabled={uploadingMou}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingMou ? "Uploading…" : formData.mou_url ? "Replace PDF" : "Upload PDF"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <input
        ref={mouInputRef}
        type="file"
        accept="application/pdf"
        aria-label="Upload MOU PDF document"
        className="hidden"
        onChange={handleMouUpload}
      />
    </div>
  );
};
