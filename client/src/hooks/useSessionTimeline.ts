import { useQuery } from "@tanstack/react-query";

export function useSessionTimeline(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-timeline", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/proctoring/session/${sessionId}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      const data = await res.json();
      return data.data;
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });
}
