import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api";

export default function AssessmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: async () => {
      const { data } = await api.get("/assessments");
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="mt-1 text-gray-500">Manage and monitor secure assessments</p>
        </div>
        <button className="btn-primary">+ Create Assessment</button>
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Proctored</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Scheduled</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : (
              data?.data?.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="badge-info">{a.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{a.durationMinutes} min</td>
                  <td className="px-4 py-3 text-sm">
                    {a.proctoringEnabled ? (
                      <span className="badge-success">Yes</span>
                    ) : (
                      <span className="badge-warning">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`badge ${
                        a.status === "COMPLETED"
                          ? "badge-success"
                          : a.status === "IN_PROGRESS"
                          ? "badge-info"
                          : a.status === "TERMINATED"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(a.scheduledAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/assessments/${a.id}/take`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Take
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
