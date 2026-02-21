import { useAuthStore } from "../../stores/authStore";

export default function EngineerPanelPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Engineer Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome, {user?.name}. Review and evaluate submitted technical assessments.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Pending Reviews", value: "—", color: "bg-amber-500" },
          { label: "Reviewed Today", value: "—", color: "bg-green-500" },
          { label: "Flagged Submissions", value: "—", color: "bg-red-500" },
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

      {/* Evaluation queue */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Evaluation Queue</h2>
        <p className="mt-4 text-center text-sm text-gray-400">
          No submissions awaiting review.
        </p>
      </div>
    </div>
  );
}
