import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import clsx from "clsx";

export default function AssessmentsPage({ isStudioView }: { isStudioView?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: async () => {
      const { data } = await api.get("/exams");
      return data;
    },
  });

  const exams = data?.data ?? [];

  return (
    <div>
      {!isStudioView && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-gray-500">Manage and monitor secure assessments</p>
          </div>
          <Link
            to="/app/assessments/blueprint"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Create Assessment
          </Link>
        </div>
      )}

      <div className={clsx("card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm", !isStudioView && "mt-6")}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Questions</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-gray-400 font-medium">No assessments yet</p>
                  <Link to="/app/assessments/blueprint" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                    Create your first assessment →
                  </Link>
                </td>
              </tr>
            ) : (
              exams.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/assessments/${a.id}/questions`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {a.total_questions ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {a.duration_minutes ?? a.duration} min
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                        a.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/assessments/${a.id}/questions`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View Questions
                      </Link>
                      <Link
                        to={`/student/exams/${a.id}/take`}
                        className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Take
                      </Link>
                    </div>
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
