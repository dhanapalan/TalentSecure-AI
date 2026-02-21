import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function ProctoringMonitorPage() {
  // In production, this would stream live data via WebSocket
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/dashboard");
      return data.data;
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Proctoring Monitor</h1>
      <p className="mt-1 text-gray-500">
        Real-time assessment integrity monitoring with face verification and browser lockdown
      </p>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">System Capabilities</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Face Verification",
              desc: "Real-time face matching against reference photo using AI",
              status: "active",
            },
            {
              title: "Browser Lockdown",
              desc: "Prevents tab switching, copy/paste, right-click, and DevTools",
              status: "active",
            },
            {
              title: "Multi-face Detection",
              desc: "Detects additional persons in the webcam frame",
              status: "active",
            },
            {
              title: "Screen Share Detection",
              desc: "Prevents screen sharing during assessments",
              status: "active",
            },
            {
              title: "Network Anomaly",
              desc: "Monitors for suspicious network patterns (VPN, proxy)",
              status: "beta",
            },
            {
              title: "Auto-termination",
              desc: "Automatically terminates session after max violations",
              status: "active",
            },
          ].map((cap) => (
            <div key={cap.title} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{cap.title}</h3>
                <span
                  className={`badge ${
                    cap.status === "active" ? "badge-success" : "badge-warning"
                  }`}
                >
                  {cap.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Integrity Overview</h2>
        <p className="mt-2 text-sm text-gray-500">
          Average integrity score across all proctored sessions:{" "}
          <span className="text-xl font-bold text-primary-600">
            {metrics?.avgProctoringIntegrity || "—"}%
          </span>
        </p>
      </div>
    </div>
  );
}
