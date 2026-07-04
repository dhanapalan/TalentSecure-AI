import { useState, useEffect } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StatusBadge from "../../../components/superadmin/StatusBadge";

interface PendingApproval {
  id: string;
  type: "college" | "content";
  name: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  details: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "college" | "content">("all");

  useEffect(() => {
    // TODO: Fetch approvals from API
    setLoading(false);
    // Mock data for now
    setApprovals([
      {
        id: "1",
        type: "college",
        name: "MIT College of Engineering",
        submittedBy: "admin@mit.edu",
        submittedAt: "2026-07-04T10:30:00Z",
        status: "pending",
        details: "New college registration request",
      },
      {
        id: "2",
        type: "content",
        name: "Python Advanced Concepts",
        submittedBy: "engineer@gradlogic.com",
        submittedAt: "2026-07-03T15:45:00Z",
        status: "pending",
        details: "AI-generated question batch - 50 questions",
      },
    ]);
  }, []);

  const filteredApprovals =
    filter === "all"
      ? approvals
      : approvals.filter((a) => a.type === filter);

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "approved" as const } : a
      )
    );
    // TODO: Call API to approve
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "rejected" as const } : a
      )
    );
    // TODO: Call API to reject
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Approvals</h2>
            <p className="text-gray-600 mt-1">
              Review and approve pending requests
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "college", "content"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${filter === type
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No {filter === "all" ? "" : filter} approvals pending</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div
              key={approval.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {approval.name}
                    </h3>
                    <StatusBadge
                      status={approval.status}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{approval.details}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Submitted By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {approval.submittedBy}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Submitted On</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(approval.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {approval.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(approval.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
