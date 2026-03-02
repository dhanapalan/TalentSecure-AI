import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  UserPlusIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import api from "../../lib/api";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// ── Components ───────────────────────────────────────────────────────────────

const MetricCard = ({ title, value, subtext, icon: Icon, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-rose-600 bg-rose-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
          {subtext && <p className="text-xs font-medium text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default function CollegeDashboardPage() {
  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["college-dashboard", "summary"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/summary");
      return res.data.data;
    }
  });

  const { data: drives, isLoading: loadingDrives } = useQuery({
    queryKey: ["college-dashboard", "drives"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/drives");
      return res.data.data;
    }
  });

  const { data: performance, isLoading: loadingPerformance } = useQuery({
    queryKey: ["college-dashboard", "performance"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/performance");
      return res.data.data;
    }
  });

  const { data: integrity, isLoading: loadingIntegrity } = useQuery({
    queryKey: ["college-dashboard", "integrity"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/integrity");
      return res.data.data;
    }
  });

  const { data: placement, isLoading: loadingPlacement } = useQuery({
    queryKey: ["college-dashboard", "placement"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/placement");
      return res.data.data;
    }
  });

  const { data: topPerformers } = useQuery({
    queryKey: ["college-dashboard", "top-performers"],
    queryFn: async () => {
      const res = await api.get("/college/dashboard/top-performers");
      return res.data.data;
    }
  });

  if (loadingSummary || loadingDrives || loadingPerformance || loadingIntegrity || loadingPlacement) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading your dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">College Dashboard</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Campus Recruitment Portal — 2025 Cycle</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/app/students/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors"
            >
              <UserPlusIcon className="h-4 w-4" />
              Register Student
            </Link>
            <Link
              to="/app/students/bulk-import"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Bulk Upload
            </Link>
            {drives?.upcoming_drives?.length > 0 && (
              <Link
                to={`/app/admin/monitoring/live/${drives.upcoming_drives[0].id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                Live Monitoring
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Students"
            value={summary?.total_students ?? 0}
            icon={UsersIcon}
            color="blue"
            subtext={`${summary?.active_students ?? 0} active`}
          />
          <MetricCard
            title="Active Drives"
            value={summary?.active_drives ?? 0}
            icon={RocketLaunchIcon}
            color="purple"
          />
          <MetricCard
            title="Avg Score"
            value={`${summary?.avg_score ?? 0}%`}
            icon={ChartBarIcon}
            color="blue"
          />
          <MetricCard
            title="Avg Integrity"
            value={`${summary?.avg_integrity ?? 0}%`}
            icon={ShieldCheckIcon}
            color={parseFloat(summary?.avg_integrity ?? 0) > 85 ? 'green' : 'amber'}
          />
          <MetricCard
            title="Placed (Est.)"
            value={`${summary?.placement_conversion ?? 0}%`}
            icon={BriefcaseIcon}
            color="green"
            subtext={`${summary?.placed_students ?? 0} students`}
          />
        </div>

        {/* ── Operational Snapshot ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900">Upcoming Drives</h2>
              <Link to="/app/drives" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-6 py-4 font-bold">Drive Name</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drives?.upcoming_drives?.map((drive: any) => (
                    <tr key={drive.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link to={`/app/drives/${drive.id}`} className="hover:underline">{drive.drive_name}</Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {drive.date ? format(new Date(drive.date), "MMM d, yyyy h:mm a") : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{drive.duration} min</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                                                    ${drive.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            drive.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'}`}>
                          {drive.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {drives?.upcoming_drives?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                        No upcoming drives.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900">Participation Status</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Completion</span>
                  <span className="text-slate-900">{drives?.participation_snapshot?.completion_percentage}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${drives?.participation_snapshot?.completion_percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned</p>
                  <p className="text-xl font-black text-slate-900">{drives?.participation_snapshot?.assigned}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Appeared</p>
                  <p className="text-xl font-black text-blue-600">{drives?.participation_snapshot?.appeared}</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Analytics & Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-500" strokeWidth={2} />
              Score Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance?.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="range"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900">Skill Performance Heatmap</h2>
            </div>
            <div className="flex-1 p-0 flex flex-col justify-center">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 font-bold text-slate-500">Skill Domain</th>
                    <th className="px-6 py-3 font-bold text-slate-500 text-right">Avg Score</th>
                    <th className="px-6 py-3 font-bold text-slate-500">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {performance?.skill_heatmap?.map((skill: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-bold text-slate-700">{skill.skill}</td>
                      <td className="px-6 py-3.5 font-black text-slate-900 text-right">{skill.avg_score}%</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${skill.strength === 'Strong' ? 'bg-emerald-500' :
                            skill.strength === 'Average' ? 'bg-amber-400' : 'bg-rose-500'
                            }`} />
                          <span className="font-semibold text-slate-600 text-xs">{skill.strength}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Integrity & Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-500" strokeWidth={2} />
              Integrity Trend (Last 5 Drives)
            </h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={integrity?.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="drive_name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                    tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_integrity"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 text-rose-700">
                <ExclamationTriangleIcon className="h-5 w-5" strokeWidth={2.5} />
                <h2 className="text-base font-black">Risk Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/50 rounded-xl p-3 border border-rose-100/50">
                  <span className="text-sm font-bold text-rose-700/80">High Risk Students</span>
                  <span className="text-xl font-black text-rose-700">{integrity?.risk_summary?.high_risk_students}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 rounded-xl p-3 border border-rose-100/50">
                  <span className="text-sm font-bold text-rose-700/80">Total Violations</span>
                  <span className="text-xl font-black text-rose-700">{integrity?.risk_summary?.total_violations}</span>
                </div>
              </div>

              <Link to="/app/proctoring" className="mt-4 text-sm font-bold text-rose-600 hover:text-rose-700 text-center block">
                View Incidents →
              </Link>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
              <div className="flex items-center gap-2 mb-4 text-amber-700">
                <ClockIcon className="h-5 w-5" strokeWidth={2.5} />
                <h2 className="text-base font-black">Action Items</h2>
              </div>
              <ul className="space-y-3">
                {drives?.upcoming_drives?.length > 0 ? (
                  <li className="text-sm font-bold text-amber-800 bg-white/60 p-3 rounded-xl border border-amber-100/50 shadow-sm">
                    Drive <span className="text-amber-600">"{drives.upcoming_drives[0].drive_name}"</span> starts soon.
                  </li>
                ) : (
                  <li className="text-sm font-semibold text-amber-700/70 text-center py-2">No urgent actions required.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Placement Funnel & Top Performers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-purple-500" strokeWidth={2} />
              Placement Pipeline
            </h2>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="relative">
                {/* Simple visual funnel approximation */}
                <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-1 px-1">
                  <span>Appeared</span>
                  <span className="text-slate-900">{placement?.funnel?.appeared}</span>
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg">
                  <div className="h-full bg-slate-300 rounded-lg" style={{ width: '100%' }}></div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-1 mt-3 px-1">
                  <span>Passed / Eligible</span>
                  <span className="text-slate-900">{placement?.funnel?.passed}</span>
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg flex justify-center">
                  <div className="h-full bg-blue-200 rounded-lg" style={{ width: '80%' }}></div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-1 mt-3 px-1">
                  <span>Shortlisted</span>
                  <span className="text-slate-900">{placement?.funnel?.shortlisted}</span>
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg flex justify-center">
                  <div className="h-full bg-purple-300 rounded-lg" style={{ width: '60%' }}></div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-1 mt-3 px-1">
                  <span>Offered / Joined</span>
                  <span className="text-emerald-600 text-base">{placement?.funnel?.offered} / {placement?.funnel?.joined}</span>
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg flex justify-center">
                  <div className="h-full bg-emerald-400 rounded-lg" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-base font-black text-slate-900">Top Performers</h2>
              <Link to="/app/students" className="text-sm font-bold text-blue-600 hover:text-blue-700">View Directory</Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-white">
                    <th className="px-6 py-4 font-bold w-16 text-center">Rank</th>
                    <th className="px-6 py-4 font-bold">Student Name</th>
                    <th className="px-6 py-4 font-bold text-center">CGPA</th>
                    <th className="px-6 py-4 font-bold text-center">Avg Score</th>
                    <th className="px-6 py-4 font-bold text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topPerformers?.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/app/students/${student.id}`}>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black
                                                    ${student.rank === 1 ? 'bg-amber-100 text-amber-600' :
                            student.rank === 2 ? 'bg-slate-200 text-slate-600' :
                              student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-500'}`}>
                          {student.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {student.student}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">
                        {student.cgpa}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900">
                        {student.avg_score}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${parseFloat(student.integrity) > 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {student.integrity}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!topPerformers || topPerformers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                        No performance data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
