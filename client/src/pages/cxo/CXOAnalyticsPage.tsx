import { useAuthStore } from "../../stores/authStore";

export default function CXOAnalyticsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CXO Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome, {user?.name}. High-level hiring insights and organizational metrics.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Hires (YTD)", value: "—", color: "bg-indigo-600" },
          { label: "Avg. Time-to-Hire", value: "—", color: "bg-cyan-500" },
          { label: "Assessment Pass Rate", value: "—", color: "bg-green-500" },
          { label: "Integrity Score (Avg)", value: "—", color: "bg-purple-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="p-5">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`h-1 ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Hiring funnel chart will render here.</p>
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Department-wise analytics chart will render here.</p>
        </div>
      </div>
    </div>
  );
}
