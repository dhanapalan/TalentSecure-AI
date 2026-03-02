import React from "react";

import { useLiveWebcam } from "../hooks/useLiveWebcam";
import { useLiveSessions } from "../hooks/useLiveSessions";
import SessionEventModal from "./SessionEventModal";

export default function PerStudentLiveView() {
  const { sessions, error, wsConnected } = useLiveSessions({});
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Per-Student Live View</h2>
      <div className="mb-2 text-xs text-slate-500">
        {wsConnected ? "Live via WebSocket" : "Polling every 5s"}
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-200 rounded-xl">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-2 text-xs font-bold text-slate-500">Student ID</th>
              <th className="p-2 text-xs font-bold text-slate-500">Drive</th>
              <th className="p-2 text-xs font-bold text-slate-500">Status</th>
              <th className="p-2 text-xs font-bold text-slate-500">Webcam</th>
              <th className="p-2 text-xs font-bold text-slate-500">Integrity</th>
              <th className="p-2 text-xs font-bold text-slate-500">Violations</th>
              <th className="p-2 text-xs font-bold text-slate-500">Started At</th>
              <th className="p-2 text-xs font-bold text-slate-500">Time Left</th>
              <th className="p-2 text-xs font-bold text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 p-4">No active sessions</td>
              </tr>
            ) : (
              sessions.map((s: any) => {
                const { image, error: webcamError } = useLiveWebcam(s.id);
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2 text-xs font-mono">{s.studentId}</td>
                    <td className="p-2 text-xs">{s.driveName}</td>
                    <td className="p-2 text-xs capitalize">{s.status}</td>
                    <td className="p-2 text-xs">
                      {webcamError ? (
                        <span className="text-red-400 text-xs">No feed</span>
                      ) : image ? (
                        <img src={image} alt="Webcam" className="w-14 h-10 object-cover rounded border" />
                      ) : (
                        <span className="text-slate-400 text-xs">Loading...</span>
                      )}
                    </td>
                    <td className="p-2 text-xs font-bold text-indigo-700">{s.integrityScore}%</td>
                    <td className="p-2 text-xs font-bold text-red-600">{s.violations}</td>
                    <td className="p-2 text-xs">{s.startedAt ? new Date(s.startedAt).toLocaleString() : "—"}</td>
                    <td className="p-2 text-xs">{s.timeRemaining != null ? Math.floor(s.timeRemaining / 60) + 'm ' + (s.timeRemaining % 60) + 's' : "—"}</td>
                    <td className="p-2 text-xs">
                      <button
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-100 text-xs font-bold text-indigo-700"
                        onClick={() => setSelectedSession(s.id)}
                      >
                        View Events
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedSession && (
        <SessionEventModal sessionId={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
