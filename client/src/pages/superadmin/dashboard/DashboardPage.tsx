import { useEffect, useState } from "react";
import {
  BuildingOffice2Icon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../../../components/superadmin/StatsCard";
import AlertCard from "../../../components/superadmin/AlertCard";
import ChartCard from "../../../components/superadmin/ChartCard";
import superadminMetrics, {
  PlatformMetrics,
  GrowthData,
  SystemAlert,
  RecentActivity,
  PendingApproval,
  MostActiveCollege,
} from "../../../services/superadminMetrics";

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [mostActiveColleges, setMostActiveColleges] = useState<MostActiveCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch primary metrics
        const [metricsData, growthDataRes, alertsData] = await Promise.all([
          superadminMetrics.getPlatformMetrics(),
          superadminMetrics.getGrowthData(),
          superadminMetrics.getSystemAlerts(),
        ]);

        setMetrics(metricsData);
        setGrowthData(growthDataRes);
        setAlerts(alertsData);

        // Fetch optional metrics in parallel but don't wait for all
        superadminMetrics.getRecentActivities(10).then(setRecentActivities).catch(() => {});
        superadminMetrics.getPendingApprovals().then(setPendingApprovals).catch(() => {});
        superadminMetrics.getMostActiveColleges(5).then(setMostActiveColleges).catch(() => {});
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Poll every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
  };

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">
          Welcome to the SuperAdmin Portal. Monitor platform health and key metrics.
        </p>
      </div>

      {/* System Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="mb-8 space-y-3">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => handleDismissAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Primary Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <StatsCard
            title="Total Colleges"
            value={metrics?.totalColleges || 0}
            icon={<BuildingOffice2Icon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Total Students"
            value={metrics?.totalStudents || 0}
            icon={<UsersIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Active Users"
            value={metrics?.activeUsers || 0}
            icon={<AcademicCapIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Pending Approvals"
            value={metrics?.pendingApprovals || 0}
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Avg Placement Readiness"
            value={metrics?.avgPlacementReadiness ? `${(metrics.avgPlacementReadiness * 100).toFixed(0)}%` : "N/A"}
            icon={<ChartBarIcon className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Content Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content & Assessments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Questions in Bank"
            value={metrics?.totalQuestions || 0}
            icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Tests Conducted"
            value={metrics?.totalTests || 0}
            icon={<SparklesIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="Certifications"
            value={metrics?.certifications || 0}
            icon={<TrophyIcon className="w-6 h-6" />}
            loading={loading}
          />
          <StatsCard
            title="AI Generated"
            value={0}
            icon={<SparklesIcon className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="New Colleges (Last 30 Days)"
          data={growthData.slice(0, 30)}
          loading={loading}
        />
        <ChartCard
          title="Student Growth (Last 30 Days)"
          data={growthData.slice(30, 60)}
          loading={loading}
        />
      </div>

      {/* Most Active Colleges */}
      {mostActiveColleges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Colleges</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mostActiveColleges.map((college) => (
                    <tr key={college.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{college.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{college.studentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(college.activityScore * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{(college.activityScore * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="grid grid-cols-1 gap-4">
            {pendingApprovals.slice(0, 5).map((approval) => (
              <a
                key={approval.id}
                href={approval.link}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-yellow-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <CheckCircleIcon className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{approval.name}</h4>
                      <p className="text-sm text-gray-600">{approval.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {new Date(approval.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    {approval.type}
                  </span>
                </div>
              </a>
            ))}
            {pendingApprovals.length > 5 && (
              <a
                href="/app/superadmin/colleges?status=pending"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
              >
                View all {pendingApprovals.length} pending approvals →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <span className="text-gray-600">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{activity.entity}</p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{activity.details}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
