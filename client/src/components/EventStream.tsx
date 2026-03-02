import { useEventStream } from "../hooks/useEventStream";

export default function EventStream() {
  const { events, wsConnected, error } = useEventStream();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Event Stream</h2>
      <div className="mb-2 text-xs text-slate-500">
        {wsConnected ? "Live via WebSocket" : "Polling every 5s"}
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="max-h-96 overflow-y-auto border rounded bg-slate-50">
        {events.length === 0 ? (
          <div className="p-3 text-slate-400 text-xs">No events yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {events.map((e: any, i: number) => (
              <li key={i} className="p-2 flex gap-2 items-center">
                <span className="font-mono text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
                <span className="font-bold text-indigo-700">{e.event_type}</span>
                <span className="text-slate-600">{e.session_id}</span>
                {e.metadata && <span className="text-slate-400">{JSON.stringify(e.metadata)}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
