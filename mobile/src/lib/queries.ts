import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "../lib/auth";
import { api } from "../lib/api";

export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();

  const { data: token, isLoading } = useQuery({
    queryKey: ["auth-token"],
    queryFn: getToken,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "login";

    if (!token && !inAuth) {
      router.replace("/login");
    } else if (token && inAuth) {
      router.replace("/(tabs)");
    }
  }, [token, isLoading, segments, router]);

  return { token, isLoading };
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data.data ?? data;
}

export async function fetchGamification() {
  const { data } = await api.get("/api/gamification/me");
  return data.data;
}

export async function fetchDailyTarget() {
  const { data } = await api.get("/api/practice/daily-target");
  return data.data;
}

export async function fetchEnrollments() {
  const { data } = await api.get("/api/student-learning/my-enrollments");
  return data.data;
}

export async function fetchProgramModules(programId: string) {
  const { data } = await api.get(`/api/student-learning/my-enrollments/${programId}/modules`);
  return data.data;
}

export async function fetchPracticeTopics() {
  const { data } = await api.get("/api/practice/topics");
  return data.data;
}

export async function startPracticeSession(topic: string, difficulty = "medium") {
  const { data } = await api.post("/api/practice/sessions", {
    topic,
    difficulty,
    session_type: "quiz",
    question_count: 10,
  });
  return data.data;
}

export async function fetchMyDrives() {
  const { data } = await api.get("/api/exam-sessions/my-drives");
  return data.data;
}

export async function startExamSession(driveId: string) {
  const { data } = await api.post(
    `/api/exam-sessions/${driveId}/start`,
    { clientType: "mobile_app" },
    { headers: { "X-Client-Type": "mobile_app" } },
  );
  return data.data;
}

export async function fetchExamSession(driveId: string) {
  const { data } = await api.get(`/api/exam-sessions/${driveId}/session`);
  return data.data;
}

export async function saveExamAnswer(
  driveId: string,
  payload: {
    saved_answers: Record<string, string>;
    current_question_index: number;
    time_remaining_seconds: number;
  },
) {
  const { data } = await api.put(`/api/exam-sessions/${driveId}/save`, payload);
  return data.data;
}

export async function submitExam(driveId: string) {
  const { data } = await api.post(`/api/exam-sessions/${driveId}/submit`);
  return data.data;
}
