import { 
  ShieldCheckIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function CollegeIntegrityPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 max-w-7xl mx-auto flex flex-col justify-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheckIcon className="h-7 w-7 text-emerald-600" />
            Integrity Monitoring
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">AI-powered proctoring and incident reports</p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-xl"></div>
            <h3 className="font-bold text-slate-500 text-sm mb-2 relative z-10">Overall Integrity Score</h3>
            <div className="flex items-end gap-2 relative z-10">
              <span className="text-4xl font-black text-emerald-600">92</span>
              <span className="text-lg font-bold text-slate-400 mb-1">/ 100</span>
            </div>
            <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Excellent Standing</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-500 text-sm mb-2">Total Proctoring Flags</h3>
            <p className="text-4xl font-black text-amber-500">14</p>
            <p className="text-xs font-medium text-slate-400 mt-2">Across 3 active assessments</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-md p-6 text-white relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-100 text-sm">Active AI Monitors</h3>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="space-y-3 font-medium text-sm text-indigo-100">
              <div className="flex items-center gap-2"><VideoCameraIcon className="w-4 h-4 text-indigo-300" /> Face Detection ON</div>
              <div className="flex items-center gap-2"><EyeSlashIcon className="w-4 h-4 text-indigo-300" /> Gaze Tracking ON</div>
              <div className="flex items-center gap-2"><ComputerDesktopIcon className="w-4 h-4 text-indigo-300" /> Tab Locking ON</div>
            </div>
          </div>
        </div>

        {/* Recent Incidents Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">Recent AI Flags</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {/* Incident 1 */}
            <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900">Multiple Faces Detected</h4>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">10 mins ago</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">Secondary face entered the camera frame for 15 seconds during "Cognizant GenC Aptitude".</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-slate-700">Student: <span className="text-indigo-600">Vikram Singh</span></span>
                  <span className="font-semibold text-slate-700">Severity: <span className="text-red-600">High</span></span>
                </div>
              </div>
            </div>

            {/* Incident 2 */}
            <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ComputerDesktopIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900">Browser Tab Hidden</h4>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">1 hour ago</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">Student navigated away from the assessment window 3 times.</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-slate-700">Student: <span className="text-indigo-600">Priya Patel</span></span>
                  <span className="font-semibold text-slate-700">Severity: <span className="text-amber-500">Medium</span></span>
                </div>
              </div>
            </div>

            {/* Incident 3 */}
            <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <EyeSlashIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900">Gaze Deviation</h4>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Yesterday</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">Prolonged looking away from the screen detected (over 20 seconds).</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-slate-700">Student: <span className="text-indigo-600">Rahul Sharma</span></span>
                  <span className="font-semibold text-slate-700">Severity: <span className="text-amber-500">Medium</span></span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
