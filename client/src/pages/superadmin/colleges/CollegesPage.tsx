import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import StatusBadge from "../../../components/superadmin/StatusBadge";

interface College {
  id: string;
  name: string;
  email: string;
  city: string;
  status: "active" | "pending" | "suspended";
  students: number;
  admins: number;
}

export default function CollegesPage() {
  const [colleges] = useState<College[]>([
    {
      id: "1",
      name: "Demo College",
      email: "college@democollege.edu",
      city: "Bangalore",
      status: "active",
      students: 150,
      admins: 3,
    },
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Colleges</h2>
          <p className="text-gray-600 mt-1">Manage all registered colleges</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5" />
          Add College
        </button>
      </div>

      {/* Colleges Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                College
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                City
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Students
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {colleges.map((college) => (
              <tr key={college.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {college.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{college.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{college.city}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {college.students}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={college.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
