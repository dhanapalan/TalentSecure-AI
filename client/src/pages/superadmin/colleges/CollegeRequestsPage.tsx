import { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StatusBadge from "../../../components/superadmin/StatusBadge";

interface CollegeRequest {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function CollegeRequestsPage() {
  const [requests, setRequests] = useState<CollegeRequest[]>([
    {
      id: "req-1",
      name: "MIT College of Engineering",
      contact: "Dr. Rajesh Kumar",
      email: "admin@mit.edu",
      city: "Bangalore",
      submittedAt: "2026-07-03T14:30:00Z",
      status: "pending",
    },
  ]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
    );
  };

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">College Requests</h2>
          <p className="text-gray-600 mt-1">Review and approve pending college registrations</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approval</h3>
          <div className="space-y-4">
            {pending.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{request.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{request.contact}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-sm font-medium text-gray-900">{request.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">City</p>
                    <p className="text-sm font-medium text-gray-900">{request.city}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved & Rejected */}
      <div className="grid grid-cols-2 gap-6">
        {approved.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved</h3>
            <div className="space-y-2">
              {approved.map((request) => (
                <div key={request.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="font-medium text-green-900">{request.name}</p>
                  <StatusBadge status="active" size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {rejected.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejected</h3>
            <div className="space-y-2">
              {rejected.map((request) => (
                <div key={request.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="font-medium text-red-900">{request.name}</p>
                  <StatusBadge status="inactive" size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pending.length === 0 && approved.length === 0 && rejected.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No college requests</p>
        </div>
      )}
    </div>
  );
}
