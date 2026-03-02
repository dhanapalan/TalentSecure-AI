
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useState } from "react";
import PerStudentLiveView from "../../components/PerStudentLiveView";
import EventStream from "../../components/EventStream";
import ViolationHeatmap from "../../components/ViolationHeatmap";

export default function ProctoringMonitorPage() {
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/dashboard");
      return data.data;
    },
  });

  const [tab, setTab] = useState<"student" | "events" | "heatmap">("student");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Proctoring Monitor</h1>
      <p className="mt-1 text-gray-500">
        Real-time assessment integrity monitoring with face verification and browser lockdown
      </p>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">System Capabilities</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* ...existing code for capabilities... */}
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

      <div className="card mt-6">
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg font-bold ${tab === "student" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setTab("student")}
          >
            Per-Student Live View
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-bold ${tab === "events" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setTab("events")}
          >
            Event Stream
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-bold ${tab === "heatmap" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setTab("heatmap")}
          >
            Violation Heatmap
          </button>
        </div>
        {tab === "student" && <PerStudentLiveView />}
        {tab === "events" && <EventStream />}
        {tab === "heatmap" && <ViolationHeatmap />}
      </div>
    </div>
  );
}
