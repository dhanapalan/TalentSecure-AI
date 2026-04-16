import { useEffect, useRef, useState } from "react";

export function useEventStream() {
  const [events, setEvents] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stopped = false;
    let pollingTimer: NodeJS.Timeout | null = null;

    function fetchEvents() {
      fetch("/api/proctoring/events?limit=100")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) throw new Error("Non-JSON response");
          return res.json();
        })
        .then((data) => {
          if (!stopped) {
            setEvents(data.data || []);
            setError(null);
          }
        })
        .catch((err) => {
          if (!stopped) setError(err.message || "Failed to fetch events");
        });
    }

    try {
      wsRef.current = new WebSocket(
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/proctoring/events`
      );
      wsRef.current.onopen = () => setWsConnected(true);
      wsRef.current.onclose = () => setWsConnected(false);
      wsRef.current.onerror = () => setWsConnected(false);
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) setEvents((prev) => [...data, ...prev].slice(0, 100));
        } catch {}
      };
    } catch {
      setWsConnected(false);
    }

    if (!wsConnected) {
      fetchEvents();
      pollingTimer = setInterval(fetchEvents, 5000);
    }

    return () => {
      stopped = true;
      if (wsRef.current) wsRef.current.close();
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, []);

  return { events, wsConnected, error };
}
