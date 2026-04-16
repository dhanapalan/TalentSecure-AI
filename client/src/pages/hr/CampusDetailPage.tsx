import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
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
  Trophy,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
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
  is_suspended: boolean;
  eligible_for_hiring: boolean;
  eligible_for_tier1: boolean;
  is_blacklisted: boolean;
  category: string;
  institution_type: string;
  region: string;
  naac_grade: string;
  nirf_rank: number | null;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  mou_status: string;
  sla: string;
  mou_url: string | null;
  contract_status: string;
  contact_email: string;
  contact_phone: string;
  internal_notes: string;
  created_at: string;
  last_activity_date: string | null;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

type TabType = "overview" | "admins" | "students" | "assessments" | "performance" | "integrity" | "agreements";

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      {children}
    </div>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-slate-800">{children || "—"}</span>;
}

function FieldInput({ value, onChange, placeholder, type = "text", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  );
}

function Skeleton({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded-md bg-slate-100 animate-pulse`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const isNew = id === "new";
  const isEditRoute = location.pathname.endsWith("/edit");

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<Partial<CampusDetails>>({});
  const [isEditingParams, setIsEditingParams] = useState(isNew || isEditRoute);
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [inviteAdminForm, setInviteAdminForm] = useState({ name: "", email: "", password: "" });

  // Students tab state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: campus, isLoading, isError } = useQuery<CampusDetails>({
    queryKey: ["campus", id],
    queryFn: async () => {
      const { data } = await api.get(`/campuses/${id}`);
      return data.data as CampusDetails;
    },
    enabled: !isNew,
    retry: 1,
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["campus-students", id, studentSearch, studentPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(studentPage), limit: "20" });
      if (studentSearch) params.set("search", studentSearch);
      const { data } = await api.get(`/campuses/${id}/students?${params}`);
      return data;
    },
    enabled: activeTab === "students" && !isNew,
  });

  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["campus-assessments", id],
    queryFn: async () => {
      const { data } = await api.get(`/campuses/${id}/assessments`);
      return data.data as any[];
    },
    enabled: activeTab === "assessments" && !isNew,
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["campus-performance", id],
    queryFn: async () => {
      const { data } = await api.get(`/campuses/${id}/performance`);
      return data.data as { distribution: any[]; trend: any[]; topPerformers: any[] };
    },
    enabled: activeTab === "performance" && !isNew,
  });

  const { data: integrityData, isLoading: integrityLoading } = useQuery({
    queryKey: ["campus-integrity", id],
    queryFn: async () => {
      const { data } = await api.get(`/campuses/${id}/integrity`);
      return data.data as { incidents: any[]; summary: any };
    },
    enabled: activeTab === "integrity" && !isNew,
  });

  useEffect(() => {
    if (campus && !isNew) {
      setFormData(campus);
      setIsEditingParams(isEditRoute);
    } else if (isNew) {
      setIsEditingParams(true);
      setFormData({ tier: "Tier 1", campus_type: "Engineering", is_active: true });
    }
  }, [campus, isNew]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: Partial<CampusDetails>) => api.post(`/campuses`, body),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus created successfully!");
      navigate(`/app/campuses/${res.data.data.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to create campus"),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Partial<CampusDetails>) => api.put(`/campuses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campus", id] });
      qc.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus updated successfully!");
      setIsEditingParams(false);
      if (isEditRoute) navigate(`/app/campuses/${id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update campus"),
  });

  const inviteAdminMutation = useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api.post(`/campuses/${id}/admins`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campus", id] });
      toast.success("Admin invited successfully!");
      setShowInviteAdmin(false);
      setInviteAdminForm({ name: "", email: "", password: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to invite admin"),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (isNew) createMutation.mutate(formData);
    else updateMutation.mutate(formData);
  };

  const handleToggle = (field: keyof CampusDetails) => {
    if (isNew) handleChange(field, !formData[field]);
    else updateMutation.mutate({ [field]: !formData[field] } as any);
  };

  const handleChange = (field: keyof CampusDetails, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const details = isEditingParams ? formData : campus || formData;
  const integrityPct = Math.min(100, Math.max(0, Math.round(100 - (details.avg_risk_score ?? 0))));

  const integrityLabel = integrityPct >= 90 ? "Excellent" : integrityPct >= 70 ? "Good" : integrityPct >= 50 ? "Fair" : "At Risk";
  const integrityColor = integrityPct >= 90 ? "border-emerald-500 text-emerald-700" : integrityPct >= 70 ? "border-blue-400 text-blue-700" : integrityPct >= 50 ? "border-amber-400 text-amber-700" : "border-red-500 text-red-700";

  const getRiskBadge = (score: number) => {
    if (score > 50) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20"><ShieldAlert className="h-4 w-4" /> High Risk</span>;
    if (score > 20) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20"><AlertTriangle className="h-4 w-4" /> Moderate Risk</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><ShieldCheck className="h-4 w-4" /> Low Risk</span>;
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "admins", label: "Admins", icon: Users },
    { id: "students", label: "Students", icon: UserCheck },
    { id: "assessments", label: "Assessments", icon: BookOpen },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "integrity", label: "Integrity", icon: Activity },
    { id: "agreements", label: "Agreements", icon: FileText },
  ];

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (isLoading && !isNew) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading campus data…</p>
        </div>
      </div>
    );
  }

  if (isError && !isNew) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 px-4">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 max-w-sm w-full">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-base font-black text-slate-800 mb-1">Failed to load campus</h2>
          <p className="text-sm text-slate-500 mb-5">The campus could not be found or you don't have access.</p>
          <Link to="/app/campuses" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back to Campuses
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">

      {/* Sticky header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/app/campuses" className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditingParams ? (
                    <input
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter Campus Name"
                      className="text-2xl font-black text-slate-900 tracking-tight bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none placeholder:text-slate-300"
                    />
                  ) : (
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{details.name || "Unnamed Campus"}</h1>
                  )}
                  {details.is_suspended && <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">Suspended</span>}
                  {details.is_blacklisted && <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">Blacklisted</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {isEditingParams ? (
                      <span className="flex gap-2">
                        <input required placeholder="City" value={formData.city || ""} onChange={(e) => handleChange("city", e.target.value)} className="w-24 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                        ,
                        <input required placeholder="State" value={formData.state || ""} onChange={(e) => handleChange("state", e.target.value)} className="w-24 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                      </span>
                    ) : (<>{details.city || "City"}, {details.state || "State"}</>)}
                  </span>
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4" />{details.tier || "Unassigned Tier"}</span>
                  {details.college_code && <span className="flex items-center gap-1.5"><Key className="h-4 w-4" />{details.college_code}</span>}
                  {!isNew && getRiskBadge(details.avg_risk_score || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditingParams ? (
                <>
                  <button
                    onClick={() => { setIsEditingParams(false); setFormData(campus || {}); if (isEditRoute) navigate(`/app/campuses/${id}`); }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!(formData.name && formData.city && formData.state) || (isNew && !(formData.adminName && formData.adminEmail && formData.adminPassword)) || updateMutation.isPending || createMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending || createMutation.isPending ? "Saving…" : isNew ? "Create Campus" : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={() => { setFormData(campus || {}); setIsEditingParams(true); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 shadow-sm"
                >
                  <Settings className="h-4 w-4" /> Edit Parameters
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* KPI row */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Students", val: details.stats?.student_count ?? details.student_count ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Admins", val: details.admins?.length ?? details.admin_count ?? 0, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Assessments", val: details.stats?.assessments_count ?? details.assessments_count ?? 0, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Avg Score", val: `${(details.stats?.avg_score ?? details.avg_score ?? 0).toFixed(1)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Integrity", val: `${integrityPct}%`, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
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

            {/* General Info */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2"><Building2 className="text-blue-600 h-5 w-5" /> General Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <FieldRow label="Institution Type">
                    {isEditingParams ? <FieldInput value={formData.institution_type || ""} onChange={(v) => handleChange("institution_type", v)} placeholder="e.g. Engineering" /> : <FieldValue>{details.institution_type}</FieldValue>}
                  </FieldRow>
                  <FieldRow label="Category">
                    {isEditingParams ? <FieldInput value={formData.category || ""} onChange={(v) => handleChange("category", v)} placeholder="e.g. Technical" /> : <FieldValue>{details.category}</FieldValue>}
                  </FieldRow>
                  <FieldRow label="NAAC Grade">
                    {isEditingParams ? <FieldInput value={formData.naac_grade || ""} onChange={(v) => handleChange("naac_grade", v)} placeholder="A, A+, B, etc." /> : <FieldValue>{details.naac_grade ? `NAAC ${details.naac_grade}` : null}</FieldValue>}
                  </FieldRow>
                  <FieldRow label="NIRF Rank">
                    {isEditingParams ? (
                      <input type="number" value={formData.nirf_rank || ""} onChange={(e) => handleChange("nirf_rank", parseInt(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 42" />
                    ) : <FieldValue>{details.nirf_rank}</FieldValue>}
                  </FieldRow>
                  <div className="col-span-1 sm:col-span-2">
                    <FieldRow label="Address">
                      {isEditingParams ? (
                        <textarea rows={2} value={formData.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Full address" />
                      ) : <FieldValue>{details.address || `${details.city}, ${details.state}`}</FieldValue>}
                    </FieldRow>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <FieldRow label="Website">
                      {isEditingParams ? (
                        <FieldInput value={formData.website || ""} onChange={(v) => handleChange("website", v)} placeholder="https://campus.edu" type="url" />
                      ) : (
                        details.website
                          ? <a href={details.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">{details.website} <ExternalLink className="h-3 w-3" /></a>
                          : <FieldValue>{null}</FieldValue>
                      )}
                    </FieldRow>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><FileText className="text-violet-600 h-5 w-5" /> Internal Notes</h3>
                {isEditingParams ? (
                  <textarea rows={4} value={formData.internal_notes || ""} onChange={(e) => handleChange("internal_notes", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Internal context about this campus relationship…" />
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 min-h-[80px] text-sm text-slate-600 whitespace-pre-wrap">
                    {details.internal_notes || <span className="italic text-slate-400">No internal notes added yet.</span>}
                  </div>
                )}
              </div>

              {/* New campus admin setup */}
              {isNew && (
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 border-l-4 border-l-blue-500">
                  <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2"><UserCheck className="text-blue-600 h-5 w-5" /> Initial Campus Administrator</h3>
                  <p className="text-sm text-slate-500 mb-5">This admin will receive an email invitation to log in.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <FieldRow label="Admin Full Name *">
                      <FieldInput value={formData.adminName || ""} onChange={(v) => handleChange("adminName" as any, v)} placeholder="e.g. John Doe" />
                    </FieldRow>
                    <FieldRow label="Admin Email *">
                      <FieldInput value={formData.adminEmail || ""} onChange={(v) => handleChange("adminEmail" as any, v)} placeholder="admin@campus.edu" type="email" />
                    </FieldRow>
                    <div className="col-span-1 sm:col-span-2">
                      <FieldRow label="Temporary Password *">
                        <FieldInput value={formData.adminPassword || ""} onChange={(v) => handleChange("adminPassword" as any, v)} placeholder="Min 6 characters" type="password" />
                      </FieldRow>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Eligibility Controls */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2"><Lock className="text-slate-700 h-5 w-5" /> Campus Eligibility</h3>
                <div className="space-y-4">
                  {[
                    { field: "eligible_for_hiring" as keyof CampusDetails, label: "Eligible for Hiring", desc: "Allow recruitment drives automatically", activeColor: "bg-emerald-500", warnColor: "" },
                    { field: "eligible_for_tier1" as keyof CampusDetails, label: "Tier 1 Exclusivity", desc: "Enable premium assessments & features", activeColor: "bg-blue-600", warnColor: "" },
                    { field: "is_suspended" as keyof CampusDetails, label: "Temporarily Suspended", desc: "Pause all active assessments & access", activeColor: "bg-amber-500", warnColor: "ring-amber-200 bg-amber-50/50" },
                    { field: "is_blacklisted" as keyof CampusDetails, label: "Blacklist Campus", desc: "Permanent ban from ecosystem", activeColor: "bg-red-600", warnColor: "ring-red-200 bg-red-50/50" },
                  ].map(({ field, label, desc, activeColor, warnColor }) => (
                    <div key={field} className={`flex items-center justify-between rounded-xl bg-white p-3 ring-1 ${warnColor || "ring-slate-100"} shadow-sm`}>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(field)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${details[field] ? activeColor : "bg-slate-200"}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${details[field] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMINS ───────────────────────────────────────────────────────── */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Campus Administrators</h3>
                <p className="text-sm text-slate-500">Manage individuals with access to this campus's tools.</p>
              </div>
              {!isNew && (
                <button onClick={() => setShowInviteAdmin(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-600/20"
                >
                  <Plus className="h-4 w-4" /> Invite Admin
                </button>
              )}
            </div>

            {showInviteAdmin && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-blue-200 border border-blue-100 p-6 relative">
                <button onClick={() => setShowInviteAdmin(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600" /> Invite Administrator</h4>
                <form onSubmit={(e) => { e.preventDefault(); inviteAdminMutation.mutate(inviteAdminForm); }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input required value={inviteAdminForm.name} onChange={(e) => setInviteAdminForm(c => ({ ...c, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input required type="email" value={inviteAdminForm.email} onChange={(e) => setInviteAdminForm(c => ({ ...c, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="admin@campus.edu" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <input required type="password" value={inviteAdminForm.password} onChange={(e) => setInviteAdminForm(c => ({ ...c, password: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Min 6 chars" />
                      <button type="submit" disabled={inviteAdminMutation.isPending || !inviteAdminForm.name || !inviteAdminForm.email || !inviteAdminForm.password}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 shrink-0">
                        {inviteAdminMutation.isPending ? "Inviting…" : "Send"}
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
                            {admin.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {admin.is_active
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Active</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Inactive</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : "Never"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">No administrators assigned yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STUDENTS ─────────────────────────────────────────────────────── */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Enrolled Students</h3>
                <p className="text-sm text-slate-500">
                  {studentsData?.pagination?.total ?? 0} students registered from this campus.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                    placeholder="Search by name, email, roll…"
                    className="w-60 rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Roll No.</th>
                    <th className="px-6 py-4">Degree</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">CGPA / %</th>
                    <th className="px-6 py-4">Latest Score</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-6 py-4"><Skeleton /></td>
                        ))}
                      </tr>
                    ))
                  ) : studentsData?.data?.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No students found.</td></tr>
                  ) : (
                    (studentsData?.data ?? []).map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{s.name || `${s.first_name} ${s.last_name}`}</div>
                          <div className="text-xs text-slate-400">{s.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-mono">{s.roll_number || "—"}</td>
                        <td className="px-6 py-4 text-xs text-slate-600">{s.degree || "—"}</td>
                        <td className="px-6 py-4 text-xs text-slate-600">{s.passing_year || "—"}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-semibold">
                          {s.cgpa != null ? `${s.cgpa} CGPA` : s.percentage != null ? `${s.percentage}%` : "—"}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-indigo-700">
                          {s.latest_score > 0 ? `${Math.round(s.latest_score)}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {s.is_active
                            ? <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                            : <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Inactive</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {studentsData?.pagination && studentsData.pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Page {studentPage} of {studentsData.pagination.pages} · {studentsData.pagination.total} total
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setStudentPage(p => Math.max(1, p - 1))} disabled={studentPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setStudentPage(p => Math.min(studentsData.pagination.pages, p + 1))} disabled={studentPage >= studentsData.pagination.pages} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ASSESSMENTS ──────────────────────────────────────────────────── */}
        {activeTab === "assessments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assessment History</h3>
                <p className="text-sm text-slate-500">Exams assigned to this campus via drives.</p>
              </div>
            </div>

            {assessmentsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
                    <Skeleton h="h-5" w="w-3/4" />
                    <Skeleton h="h-3" w="w-1/2" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} h="h-8" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : !assessmentsData?.length ? (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <h4 className="text-base font-bold text-slate-700">No assessments assigned yet</h4>
                <p className="text-sm text-slate-400 mt-1">Assessments are assigned when you create a drive and link campuses.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assessmentsData.map((exam: any) => (
                  <div key={exam.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{exam.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{exam.duration_minutes} min · {exam.total_marks} marks</p>
                      </div>
                      {exam.is_active
                        ? <span className="shrink-0 ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                        : <span className="shrink-0 ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Inactive</span>
                      }
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {[
                        { label: "Attempts", value: exam.attempts ?? 0 },
                        { label: "Avg Score", value: exam.avg_score != null ? `${Math.round(exam.avg_score)}` : "—" },
                        { label: "Pass Rate", value: exam.pass_rate != null ? `${Math.round(exam.pass_rate)}%` : "—" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-slate-50 p-2.5 text-center">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PERFORMANCE ──────────────────────────────────────────────────── */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900">Performance Analytics</h3>

            {performanceLoading ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 h-64 flex items-end gap-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="flex-1 bg-slate-100 animate-pulse rounded" style={{ height: `${30 + j * 15}%` }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : !performanceData ? (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-10 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <h4 className="text-base font-bold text-slate-700">No performance data yet</h4>
                <p className="text-sm text-slate-400 mt-1">Performance metrics will appear once students complete assessments.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Score distribution */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Score Distribution</h4>
                    <p className="text-xs text-slate-400 mb-4">Number of students per score band</p>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData.distribution} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Score trend */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Monthly Avg Score</h4>
                    <p className="text-xs text-slate-400 mb-4">Last 6 months</p>
                    <div className="h-52">
                      {performanceData.trend.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-400">No trend data yet</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceData.trend} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="avg_score" name="Avg Score" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradScore)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top performers */}
                {performanceData.topPerformers.length > 0 && (
                  <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <h4 className="text-sm font-bold text-slate-800">Top Performers</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-6 py-3 text-left">Rank</th>
                          <th className="px-6 py-3 text-left">Student</th>
                          <th className="px-6 py-3 text-left">Degree</th>
                          <th className="px-6 py-3 text-left">Best Score</th>
                          <th className="px-6 py-3 text-left">Attempts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {performanceData.topPerformers.map((s: any, i: number) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-black text-slate-500">#{i + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{s.name}</div>
                              <div className="text-xs text-slate-400">{s.email}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">{s.degree || "—"}</td>
                            <td className="px-6 py-4 text-sm font-black text-indigo-700">{s.best_score}</td>
                            <td className="px-6 py-4 text-xs text-slate-600">{s.attempts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── INTEGRITY ────────────────────────────────────────────────────── */}
        {activeTab === "integrity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900">Trust & Integrity Monitoring</h3>

            {integrityLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-2">
                    <Skeleton w="w-8" h="h-8" />
                    <Skeleton w="w-20" h="h-3" />
                    <Skeleton w="w-12" h="h-7" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Incidents", value: integrityData?.summary?.total_incidents ?? 0, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50" },
                    { label: "Critical (≥70)", value: integrityData?.summary?.critical ?? 0, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Moderate (40–69)", value: integrityData?.summary?.moderate ?? 0, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Avg Risk Score", value: integrityData?.summary?.avg_risk_score ?? 0, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                      <p className={`mt-1 text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Integrity ring */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 flex flex-col items-center justify-center gap-3">
                    <div className={`h-24 w-24 rounded-full border-8 flex items-center justify-center ${integrityColor}`}>
                      <span className="text-lg font-black">{integrityPct}%</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800">{integrityLabel} Integrity</p>
                      <p className="text-xs text-slate-400 mt-0.5">Based on proctoring data</p>
                    </div>
                  </div>

                  {/* Recent incidents table */}
                  <div className="md:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800">Recent Flagged Incidents</h4>
                    </div>
                    {!integrityData?.incidents?.length ? (
                      <div className="py-10 text-center">
                        <ShieldCheck className="mx-auto h-8 w-8 text-emerald-300 mb-2" />
                        <p className="text-sm text-slate-400">No incidents flagged for this campus.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="px-5 py-3 text-left">Student</th>
                              <th className="px-5 py-3 text-left">Event</th>
                              <th className="px-5 py-3 text-left">Exam</th>
                              <th className="px-5 py-3 text-left">Risk</th>
                              <th className="px-5 py-3 text-left">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {integrityData.incidents.slice(0, 10).map((inc: any) => (
                              <tr key={inc.id} className="hover:bg-slate-50">
                                <td className="px-5 py-3">
                                  <div className="font-semibold text-slate-900 text-xs">{inc.student_name}</div>
                                  <div className="text-slate-400 text-[10px]">{inc.student_email}</div>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-600">{inc.event_type}</td>
                                <td className="px-5 py-3 text-xs text-slate-500 max-w-[140px] truncate">{inc.exam_title || "—"}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${inc.risk_score >= 70 ? "bg-red-100 text-red-700" : inc.risk_score >= 40 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                                    {inc.risk_score}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-400">
                                  {new Date(inc.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── AGREEMENTS ───────────────────────────────────────────────────── */}
        {activeTab === "agreements" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900">Enterprise Contracts & SLA</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <FieldRow label="Contract Status">
                    {isEditingParams ? (
                      <select value={formData.contract_status || "Active"} onChange={(e) => handleChange("contract_status", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Active</option>
                        <option>Pending Signature</option>
                        <option>Expired</option>
                        <option>Negotiating</option>
                        <option>Terminated</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${details.contract_status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {details.contract_status || "Active"}
                      </span>
                    )}
                  </FieldRow>

                  <FieldRow label="SLA">
                    {isEditingParams ? <FieldInput value={formData.sla || ""} onChange={(v) => handleChange("sla", v)} placeholder="e.g. 99.9% uptime" /> : <FieldValue>{details.sla || "Standard Corporate SLA"}</FieldValue>}
                  </FieldRow>

                  <FieldRow label="Agreement Start Date">
                    {isEditingParams ? (
                      <input type="date" value={formData.agreement_start_date ? new Date(formData.agreement_start_date).toISOString().split("T")[0] : ""} onChange={(e) => handleChange("agreement_start_date", new Date(e.target.value).toISOString())} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : <FieldValue>{details.agreement_start_date ? new Date(details.agreement_start_date).toLocaleDateString() : null}</FieldValue>}
                  </FieldRow>

                  <FieldRow label="Agreement End Date">
                    {isEditingParams ? (
                      <input type="date" value={formData.agreement_end_date ? new Date(formData.agreement_end_date).toISOString().split("T")[0] : ""} onChange={(e) => handleChange("agreement_end_date", new Date(e.target.value).toISOString())} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : <FieldValue>{details.agreement_end_date ? new Date(details.agreement_end_date).toLocaleDateString() : null}</FieldValue>}
                  </FieldRow>

                  {/* Agreement status alert */}
                  {details.agreement_end_date && !isEditingParams && (
                    (() => {
                      const daysLeft = Math.ceil((new Date(details.agreement_end_date).getTime() - Date.now()) / 86400000);
                      if (daysLeft < 0) return (
                        <div className="col-span-2 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-xs text-red-700">
                          <AlertCircle className="h-4 w-4 shrink-0" /> Agreement expired {Math.abs(daysLeft)} days ago.
                        </div>
                      );
                      if (daysLeft < 30) return (
                        <div className="col-span-2 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-xs text-amber-700">
                          <Clock className="h-4 w-4 shrink-0" /> Agreement expires in {daysLeft} days — renewal needed.
                        </div>
                      );
                      return (
                        <div className="col-span-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-emerald-700">
                          <CheckCircle className="h-4 w-4 shrink-0" /> Agreement active for {daysLeft} more days.
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* MOU Upload */}
              <div className="col-span-1 rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200 p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300">
                <FileText className="h-12 w-12 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">MOU Document</h4>
                {details.mou_url ? (
                  <a href={details.mou_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4" /> View Document
                  </a>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 text-center">Upload the signed contract PDF for reference.</p>
                    <button
                      onClick={() => toast("MOU upload requires file storage integration.", { icon: "📎" })}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> Upload PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
