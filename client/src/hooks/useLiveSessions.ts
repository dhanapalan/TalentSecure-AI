import { useEffect, useState } from "react";
import api from "../lib/api";

export function useLiveSessions({ driveId }: { driveId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollingTimer: NodeJS.Timeout | null = null;
    let stopped = false;

    function fetchSessions() {
      api
        .get("/proctoring/live" + (driveId ? `?driveId=${driveId}` : ""))
        .then((res) => {
          if (!stopped) setSessions(res.data.data || []);
        })
        .catch((err) => {
          if (!stopped) setError(err.message || "Failed to fetch live sessions");
        });
    }

    // Try WebSocket first
    try {
      ws = new WebSocket(
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/proctoring/live` +
          (driveId ? `?driveId=${driveId}` : "")
      );
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) setSessions(data);
        } catch {}
      };
    } catch {
      setWsConnected(false);
    }

    // Fallback polling if WebSocket fails
    if (!wsConnected) {
      fetchSessions();
      pollingTimer = setInterval(fetchSessions, 5000);
    }

    return () => {
      stopped = true;
      if (ws) ws.close();
      if (pollingTimer) clearInterval(pollingTimer);
    };
    // eslint-disable-next-line
  }, [driveId]);

  return { sessions, error, wsConnected };
}
