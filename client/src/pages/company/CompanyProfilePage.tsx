import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { Building2, Globe, MapPin, Save, Loader2, Briefcase } from "lucide-react";

interface CompanyProfile {
  name: string;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  headquarters: string | null;
  user_name: string;
  email: string;
}

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "E-Commerce",
  "Manufacturing", "Education", "Consulting", "Telecommunications",
  "Media & Entertainment", "Automotive", "Real Estate", "Other",
];

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["company-profile"],
    queryFn: () => api.get("/company/profile").then(r => r.data.data as CompanyProfile),
  });

  const [form, setForm] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: Partial<CompanyProfile>) => api.put("/company/profile", body),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to save"),
  });

  const set = (key: keyof CompanyProfile, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900">Company Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">This information is shown to colleges and students in your drives</p>
      </div>

      {/* Logo preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
            {form.logo_url
              ? <img src={form.logo_url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              : <Building2 className="h-8 w-8 text-indigo-300" />}
          </div>
          <div>
            <p className="font-black text-slate-900">{form.name || "Your Company"}</p>
            <p className="text-xs text-slate-400">{data?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Company name */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Acme Technologies"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Industry</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={form.industry ?? ""}
                onChange={e => set("industry", e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Headquarters */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Headquarters</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={form.headquarters ?? ""}
                onChange={e => set("headquarters", e.target.value)}
                placeholder="e.g. Bangalore, India"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="url"
                value={form.website ?? ""}
                onChange={e => set("website", e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={form.logo_url ?? ""}
              onChange={e => set("logo_url", e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">About</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Brief description of your company, what you do, and what you look for in candidates…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
        </div>

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !form.name?.trim()}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
        >
          {mutation.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4" /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
