import { useEffect, useState } from "react";
import { ChartBarIcon, UserGroupIcon, ShieldCheckIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import api from "../../../lib/api";

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bgColor: string;
  textColor: string;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/superadmin/analytics/platform?days=${days}`);
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metricCards: MetricCard[] = [
    {
      title: "Total Users",
      value: metrics?.summary?.total_users || 0,
      icon: UserGroupIcon,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Active Users",
      value: metrics?.summary?.active_users || 0,
      icon: UserGroupIcon,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Total Roles",
      value: metrics?.summary?.total_roles || 0,
      icon: ShieldCheckIcon,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Workflows",
      value: metrics?.summary?.total_workflows || 0,
      icon: BookOpenIcon,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">System metrics and performance overview</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              days === d
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`${card.bgColor} rounded-lg p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor} mt-2`}>{card.value}</p>
                </div>
                <Icon className={`w-12 h-12 ${card.textColor} opacity-20`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">User Growth</h2>
        {metrics?.users_growth && metrics.users_growth.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">New Users</th>
                </tr>
              </thead>
              <tbody>
                {metrics.users_growth.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{row.date}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">{row.new_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-l-4 border-blue-600 pl-4 py-2">
            <p className="text-gray-600 text-sm">Admins</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.summary?.admin_count || 0}</p>
          </div>
          <div className="border-l-4 border-green-600 pl-4 py-2">
            <p className="text-gray-600 text-sm">Teachers</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.summary?.teacher_count || 0}</p>
          </div>
          <div className="border-l-4 border-purple-600 pl-4 py-2">
            <p className="text-gray-600 text-sm">Students</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.summary?.student_count || 0}</p>
          </div>
          <div className="border-l-4 border-orange-600 pl-4 py-2">
            <p className="text-gray-600 text-sm">Audit Logs</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.summary?.total_audit_logs || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
