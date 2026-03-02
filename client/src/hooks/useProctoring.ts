import { useEffect, useCallback, useRef } from "react";
import api from "../lib/api";

interface UseProctoringOptions {
    sessionId: string;
    enabled?: boolean;
}

export function useProctoring({ sessionId, enabled = true }: UseProctoringOptions) {
    // Keep track of last fired events to debounce rapid identical fires
    const lastEventTimeMap = useRef<Record<string, number>>({});

    const logEvent = useCallback((eventType: string, metadata?: any) => {
        if (!enabled || !sessionId) return;

        const now = Date.now();
        const lastTime = lastEventTimeMap.current[eventType] || 0;

        // Debounce identical events (e.g. holding down copy) to 1 every 2 seconds
        if (now - lastTime < 2000) return;
        lastEventTimeMap.current[eventType] = now;

        // Fire-and-forget: do not await or block the UI on this
        api.post("/proctoring/events", {
            sessionId,
            eventType,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        }).catch(err => {
            // Fails safe: if monitoring API is down, standard exam flow continues
            console.warn(`[Proctoring] Failed to log ${eventType}:`, err);
        });
    }, [sessionId, enabled]);

    useEffect(() => {
        if (!enabled) return;

        // 1. Visibility Change (Tab Switch / Window Blur)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                logEvent("TAB_SWITCH", { state: "hidden" });
            } else if (document.visibilityState === "visible") {
                logEvent("TAB_SWITCH", { state: "visible" });
            }
        };

        // 2. Window Blur (e.g. clicking another app but tab stays open)
        const handleWindowBlur = () => {
            logEvent("WINDOW_BLUR");
        };

        // 3. Copy/Paste Attempts
        const handleCopy = (e: ClipboardEvent) => {
            logEvent("COPY_ATTEMPT");
            e.preventDefault();
        };

        const handlePaste = (e: ClipboardEvent) => {
            logEvent("PASTE_ATTEMPT");
            e.preventDefault();
        };

        // 4. Right-Click (Context Menu)
        const handleContextMenu = (e: MouseEvent) => {
            logEvent("RIGHT_CLICK");
            e.preventDefault();
        };

        // 5. Fullscreen Exit
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logEvent("FULLSCREEN_EXIT");
            }
        };

        // 6. Network Disconnect
        const handleOffline = () => {
            logEvent("NETWORK_DISCONNECT", { status: "offline" });
        };
        const handleOnline = () => {
            logEvent("NETWORK_DISCONNECT", { status: "reconnected" });
        };

        // 7. DevTools detection (heuristic: checking if window dimensions change drastically)
        const handleResize = () => {
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;
            if (widthDiff > threshold || heightDiff > threshold) {
                logEvent("DEVTOOLS_OPEN", { widthDiff, heightDiff });
            }
        };

        // Attach listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("resize", handleResize);
        };
    }, [enabled, logEvent]);

    return { logEvent };
}
