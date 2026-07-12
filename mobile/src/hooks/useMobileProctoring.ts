import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { api } from "../lib/api";

interface UseMobileProctoringOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useMobileProctoring({ sessionId, enabled = true }: UseMobileProctoringOptions) {
  const lastEventRef = useRef<Record<string, number>>({});
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const logEvent = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      if (!enabled || !sessionId) return;

      const now = Date.now();
      const last = lastEventRef.current[eventType] ?? 0;
      if (now - last < 2000) return;
      lastEventRef.current[eventType] = now;

      api
        .post("/api/proctoring/events", {
          sessionId,
          eventType,
          metadata: {
            ...metadata,
            clientType: "mobile_app",
            timestamp: new Date().toISOString(),
          },
        })
        .catch(() => {
          /* non-blocking */
        });
    },
    [sessionId, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current === "active" && nextState.match(/inactive|background/)) {
        logEvent("APP_BACKGROUNDED", { state: nextState });
      }
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        logEvent("APP_FOREGROUNDED", { state: nextState });
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [enabled, logEvent]);

  return { logEvent };
}
