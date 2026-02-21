import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function AnalyticsPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/dashboard");
      return data.data;
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mt-1 text-gray-500">Recruitment funnel and talent pool insights</p>

      {isLoading ? (
        <p className="mt-8 text-gray-400">Loading analytics…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary-600">{metrics?.totalStudents ?? 0}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">
                {metrics?.assessmentCompletionRate ?? 0}%
              </p>
              <p className="text-sm text-gray-500">Assessment Completion Rate</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-purple-600">
                {metrics?.avgProctoringIntegrity ?? 0}%
              </p>
              <p className="text-sm text-gray-500">Avg Proctoring Integrity</p>
            </div>
          </div>

          {metrics?.segmentDistribution && (
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Segment Distribution</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(metrics.segmentDistribution).map(([name, count]) => {
                  const total = metrics.totalStudents || 1;
                  const pct = ((count as number) / total) * 100;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{name}</span>
                        <span className="text-gray-500">{count as number} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-primary-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
