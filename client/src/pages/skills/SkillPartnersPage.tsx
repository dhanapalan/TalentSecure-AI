import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Handshake, Globe, Mail, Phone, Pencil, Trash2, X, Save, Upload, ExternalLink } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useRef } from "react";

interface Partner {
  id: string;
  name: string;
  partner_type: string;
  college_name: string | null;
  mou_url: string | null;
  mou_status: string;
  agreement_start: string | null;
  agreement_end: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  website: string | null;
  is_active: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  edtech:     "bg-blue-100 text-blue-700",
  industry:   "bg-violet-100 text-violet-700",
  government: "bg-amber-100 text-amber-700",
  ngo:        "bg-emerald-100 text-emerald-700",
};

const STATUS_COLORS: Record<string, string> = {
  Active:             "bg-emerald-100 text-emerald-700",
  "Pending Signature":"bg-amber-100 text-amber-700",
  Expired:            "bg-red-100 text-red-700",
  Terminated:         "bg-slate-100 text-slate-600",
};

const EMPTY_FORM = { name: "", partner_type: "edtech", mou_status: "Active", agreement_start: "", agreement_end: "", contact_email: "", contact_name: "", contact_phone: "", website: "", is_active: true };

export default function SkillPartnersPage() {
  const qc = useQueryClient();
  const mouInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["skill-partners", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      return (await api.get(`/skill-partners?${params}`)).data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/skill-partners", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-partners"] }); toast.success("Partner added"); setShowForm(false); setForm(EMPTY_FORM); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/skill-partners/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-partners"] }); toast.success("Partner updated"); setEditingPartner(null); setShowForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/skill-partners/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-partners"] }); toast.success("Partner deleted"); },
  });

  const handleMouUpload = async (e: React.ChangeEvent<HTMLInputElement>, partnerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("mou_file", file);
    setUploadingId(partnerId);
    try {
      await api.post(`/skill-partners/${partnerId}/upload-mou`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      qc.invalidateQueries({ queryKey: ["skill-partners"] });
      toast.success("MOU uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingId(null); if (mouInputRef.current) mouInputRef.current.value = ""; }
  };

  const handleSave = () => {
    const body = {
      ...form,
      agreement_start: form.agreement_start ? new Date(form.agreement_start).toISOString() : null,
      agreement_end: form.agreement_end ? new Date(form.agreement_end).toISOString() : null,
      contact_email: form.contact_email || null,
      website: form.website || null,
    };
    if (editingPartner) updateMutation.mutate({ id: editingPartner.id, body });
    else createMutation.mutate(body);
  };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    setForm({ name: p.name, partner_type: p.partner_type || "edtech", mou_status: p.mou_status || "Active",
      agreement_start: p.agreement_start ? p.agreement_start.split("T")[0] : "",
      agreement_end: p.agreement_end ? p.agreement_end.split("T")[0] : "",
      contact_email: p.contact_email || "", contact_name: p.contact_name || "",
      contact_phone: p.contact_phone || "", website: p.website || "", is_active: p.is_active });
    setShowForm(true);
  };

  const filtered = partners.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Handshake className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-black text-slate-900">Skill Dev Partners</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">EdTech, industry and government MOU partners</p>
        </div>
        <button onClick={() => { setEditingPartner(null); setForm(EMPTY_FORM); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600">
          <Plus className="h-4 w-4" /> Add Partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: partners.length, color: "text-slate-900" },
          { label: "Active", value: partners.filter(p => p.is_active).length, color: "text-emerald-600" },
          { label: "With MOU", value: partners.filter(p => p.mou_url).length, color: "text-indigo-600" },
          { label: "EdTech", value: partners.filter(p => p.partner_type === "edtech").length, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="flex gap-2">
          {["all", "edtech", "industry", "government", "ngo"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${typeFilter === t ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Partner Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Handshake className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-lg font-bold text-slate-400">No partners found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {p.partner_type && <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${TYPE_COLORS[p.partner_type] || "bg-slate-100 text-slate-600"}`}>{p.partner_type}</span>}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.mou_status] || "bg-slate-100 text-slate-600"}`}>{p.mou_status}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-3">{p.name}</h3>
              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                {p.contact_name && <p className="font-semibold text-slate-700">{p.contact_name}</p>}
                {p.contact_email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{p.contact_email}</p>}
                {p.contact_phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{p.contact_phone}</p>}
                {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline"><Globe className="h-3.5 w-3.5" />{p.website}</a>}
                {p.agreement_end && <p>Agreement ends: <span className="font-bold">{new Date(p.agreement_end).toLocaleDateString()}</span></p>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                {p.mou_url ? (
                  <a href={p.mou_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> View MOU
                  </a>
                ) : null}
                <input ref={mouInputRef} type="file" accept="application/pdf" className="hidden" aria-label="Upload MOU" onChange={e => handleMouUpload(e, p.id)} />
                <button onClick={() => { mouInputRef.current?.click(); }} disabled={uploadingId === p.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 ml-auto">
                  <Upload className="h-3.5 w-3.5" /> {uploadingId === p.id ? "Uploading…" : p.mou_url ? "Replace MOU" : "Upload MOU"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">{editingPartner ? "Edit Partner" : "Add Partner"}</h3>
              <button onClick={() => { setShowForm(false); setEditingPartner(null); }}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Partner Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Coursera" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Type</label>
                  <select value={form.partner_type} onChange={e => setForm(p => ({ ...p, partner_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Partner type">
                    <option value="edtech">EdTech</option>
                    <option value="industry">Industry</option>
                    <option value="government">Government</option>
                    <option value="ngo">NGO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">MOU Status</label>
                  <select value={form.mou_status} onChange={e => setForm(p => ({ ...p, mou_status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="MOU status">
                    <option>Active</option>
                    <option>Pending Signature</option>
                    <option>Expired</option>
                    <option>Terminated</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Agreement Start</label>
                  <input type="date" value={form.agreement_start} onChange={e => setForm(p => ({ ...p, agreement_start: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Agreement start date" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Agreement End</label>
                  <input type="date" value={form.agreement_end} onChange={e => setForm(p => ({ ...p, agreement_end: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="Agreement end date" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Name</label>
                <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="partner@org.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</label>
                  <input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Website</label>
                <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://partner.com" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                <span className="text-sm font-bold text-slate-700">Active partnership</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditingPartner(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> {editingPartner ? "Update" : "Add Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
