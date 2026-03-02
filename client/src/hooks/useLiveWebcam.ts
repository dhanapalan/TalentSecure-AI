import { useEffect, useState } from "react";

export function useLiveWebcam(sessionId: string | null) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let ws: WebSocket | null = null;
    let stopped = false;

    try {
      ws = new WebSocket(
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/proctoring/webcam?sessionId=${sessionId}`
      );
      ws.onmessage = (event) => {
        if (!stopped && typeof event.data === "string") {
          setImage(event.data);
        }
      };
      ws.onerror = () => setError("Webcam stream error");
    } catch {
      setError("Webcam connection failed");
    }

    return () => {
      stopped = true;
      if (ws) ws.close();
    };
  }, [sessionId]);

  return { image, error };
}
