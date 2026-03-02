import { useSessionTimeline } from "../hooks/useSessionTimeline";

export default function SessionEventModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data, isLoading, error } = useSessionTimeline(sessionId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-red-600">✕</button>
        <h3 className="text-lg font-bold mb-4">Session Event Timeline</h3>
        <div className="text-slate-500 mb-2">Session ID: <span className="font-mono">{sessionId}</span></div>
        {isLoading && <div className="text-slate-400">Loading...</div>}
        {error && <div className="text-red-600">{String(error)}</div>}
        {data && (
          <>
            <div className="mb-2">
              <div className="text-xs text-slate-500 mb-1">Summary:</div>
              <div className="flex gap-4 text-xs">
                <span>Status: <b>{data.summary?.status}</b></span>
                <span>Integrity: <b>{data.summary?.integrity_score}%</b></span>
                <span>Violations: <b>{data.summary?.violations}</b></span>
              </div>
            </div>
            {data.incident && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="text-xs text-amber-700 font-bold">Incident: {data.incident.risk_level} risk</div>
                <div className="text-xs text-slate-600">Score: {data.incident.score} | Status: {data.incident.status}</div>
              </div>
            )}
            <div className="mt-2">
              <div className="text-xs text-slate-500 mb-1">Event Timeline:</div>
              <div className="max-h-64 overflow-y-auto border rounded bg-slate-50">
                {data.events.length === 0 ? (
                  <div className="p-3 text-slate-400 text-xs">No events recorded.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {data.events.map((e: any, i: number) => (
                      <li key={i} className="p-2 flex gap-2 items-center">
                        <span className="font-mono text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
                        <span className="font-bold text-indigo-700">{e.event_type}</span>
                        {e.metadata && <span className="text-slate-600">{JSON.stringify(e.metadata)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
