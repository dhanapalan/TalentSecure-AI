import { useState } from "react";
import { 
  BuildingOfficeIcon,
  GlobeAltIcon,
  LinkIcon,
  ShieldCheckIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

export default function CollegeSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 max-w-7xl mx-auto flex flex-col justify-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BuildingOfficeIcon className="h-7 w-7 text-indigo-600" />
            Campus Settings
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Manage portal configuration, integrations, and branding</p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "general" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <BuildingOfficeIcon className="w-5 h-5" /> General Profile
          </button>
          <button 
            onClick={() => setActiveTab("integrations")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "integrations" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <LinkIcon className="w-5 h-5" /> Integrations
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "security" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" /> Security & Access
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {activeTab === "general" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900">General Profile</h2>
                <p className="text-sm text-slate-500">Public information displayed to students and corporate partners.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">College Name</label>
                  <input type="text" defaultValue="Nallas Institute of Technology" className="w-full xl:w-2/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:w-2/3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">University Affiliation</label>
                    <input type="text" defaultValue="Anna University" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Established Year</label>
                    <input type="text" defaultValue="2005" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Primary Address</label>
                  <textarea rows={3} defaultValue="123 Tech Park Road, Silicon Valley, CA 94025" className="w-full xl:w-2/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email (Placement Cell)</label>
                  <div className="relative xl:w-2/3">
                    <GlobeAltIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input type="email" defaultValue="placements@nallas.edu" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900">API & Integrations</h2>
                <p className="text-sm text-slate-500">Connect your campus portal to third-party tools.</p>
              </div>
              
              <div className="divide-y divide-slate-100">
                <div className="p-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                      LMS Database Sync
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
                    </h3>
                    <p className="text-sm text-slate-600">Automatically synchronize student rolls from your internal Learning Management System.</p>
                    <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Active - Last synced 2 hours ago</p>
                  </div>
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold shadow-sm transition-colors">Configure</button>
                </div>

                <div className="p-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Email Broadcasting (SMTP)</h3>
                    <p className="text-sm text-slate-600">Route all "Communications" via your college's official email domain.</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors">Connect</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900">Security & Authentication</h2>
                <p className="text-sm text-slate-500">Manage login policies and IP restrictions.</p>
              </div>

               <div className="p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm text-slate-500 mt-1">Require 2FA for all College Administrators and Staff.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Student Device Locking</h3>
                      <p className="text-sm text-slate-500 mt-1">Bind student accounts to a single device/IP address during assessments.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
