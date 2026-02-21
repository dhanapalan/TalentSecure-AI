import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function RolesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get("/roles");
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-gray-500">Job roles and technical requirements</p>
        </div>
        <button className="btn-primary">+ Add Role</button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-gray-400">Loading roles…</p>
        ) : (
          data?.data?.map((role: any) => (
            <div key={role.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{role.title}</h3>
                <span
                  className={`badge ${
                    role.status === "ACTIVE"
                      ? "badge-success"
                      : role.status === "DRAFT"
                      ? "badge-warning"
                      : "badge-danger"
                  }`}
                >
                  {role.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{role.company}</p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{role.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">Min CGPA: {role.minCGPA}</span>
                <span className="text-gray-500">{role.maxPositions} positions</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
