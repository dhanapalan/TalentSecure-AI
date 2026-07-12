import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQuery } from "@tanstack/react-query";
import {
  fetchExamSession,
  saveExamAnswer,
  submitExam,
} from "../../../src/lib/queries";
import { useMobileProctoring } from "../../../src/hooks/useMobileProctoring";
import { getApiBaseUrl } from "../../../src/lib/api";
import { getUser } from "../../../src/lib/auth";
import type { ExamQuestion, User } from "../../../src/types";

function normalizeOptions(options: ExamQuestion["options"]): string[] {
  if (Array.isArray(options)) return options;
  if (options && typeof options === "object") return Object.values(options);
  return [];
}

export default function ExamPlayScreen() {
  const { driveId } = useLocalSearchParams<{ driveId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const timeRef = useRef(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["exam-session", driveId],
    queryFn: () => fetchExamSession(driveId!),
    enabled: !!driveId,
  });

  const sessionId = data?.session?.session_id ?? data?.session_id;
  const questions: ExamQuestion[] = data?.questions ?? [];
  const timeRemaining = data?.session?.time_remaining_seconds ?? data?.time_remaining_seconds ?? 0;
  const current = questions[index];

  useEffect(() => {
    timeRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const { logEvent } = useMobileProctoring({ sessionId: sessionId ?? "", enabled: !!sessionId });

  useEffect(() => {
    getUser<User>().then(setUser);
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Periodic camera frame analysis (every 6s on mobile to save battery)
  useEffect(() => {
    if (!sessionId || !permission?.granted || !user) return;

    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current?.takePictureAsync({
          base64: true,
          quality: 0.5,
          skipProcessing: true,
        });
        if (!photo?.base64) return;

        const apiUrl = getApiBaseUrl();
        await fetch(`${apiUrl}/api/proctoring/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: `data:image/jpeg;base64,${photo.base64}`,
            student_id: user.id,
            exam_id: driveId,
            client_type: "mobile_app",
            confidence_threshold: 0.55,
          }),
        });
      } catch {
        logEvent("CAMERA_INTERRUPTED");
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [sessionId, permission?.granted, user, driveId, logEvent]);

  const selectAnswer = useCallback(
    async (optionIndex: number) => {
      if (!current || !driveId) return;
      const key = String(optionIndex);
      const nextAnswers = { ...answersRef.current, [current.id]: key };
      setAnswers(nextAnswers);
      answersRef.current = nextAnswers;
      try {
        await saveExamAnswer(driveId, {
          saved_answers: nextAnswers,
          current_question_index: index,
          time_remaining_seconds: timeRef.current,
        });
      } catch {
        /* autosave best-effort */
      }
    },
    [current, driveId, index],
  );

  const handleSubmit = () => {
    Alert.alert("Submit exam", "Submit your answers now?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: async () => {
          setSubmitting(true);
          try {
            const result = await submitExam(driveId!);
            Alert.alert(
              "Submitted",
              `Score: ${result.score ?? result.data?.score ?? "pending"}`,
              [{ text: "OK", onPress: () => router.replace("/(tabs)/exams") }],
            );
          } catch {
            Alert.alert("Error", "Submit failed. Try again.");
            refetch();
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Camera permission is required for proctored exams.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.timer}>
          {mins}:{secs.toString().padStart(2, "0")}
        </Text>
        <Text style={styles.counter}>
          Q {index + 1}/{questions.length}
        </Text>
      </View>

      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      <ScrollView style={styles.body}>
        <Text style={styles.question}>{current.question_text}</Text>
        {normalizeOptions(current.options).map((opt, i) => {
          const selected = answers[current.id] === String(i);
          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => selectAnswer(i)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navBtn}
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>
        {index < questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtn} onPress={() => setIndex((i) => i + 1)}>
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  msg: { color: "#fff", textAlign: "center", marginBottom: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    paddingTop: 48,
    backgroundColor: "#1e293b",
  },
  timer: { color: "#fbbf24", fontSize: 18, fontWeight: "700" },
  counter: { color: "#94a3b8", fontSize: 16 },
  camera: { height: 100, marginHorizontal: 12, borderRadius: 8, overflow: "hidden" },
  body: { flex: 1, padding: 16 },
  question: { color: "#f8fafc", fontSize: 17, fontWeight: "600", marginBottom: 16 },
  option: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  optionSelected: { borderColor: "#3b82f6", backgroundColor: "#1e3a8a" },
  optionText: { color: "#e2e8f0", fontSize: 15 },
  optionTextSelected: { color: "#fff" },
  footer: { flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#1e293b" },
  navBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  navText: { color: "#e2e8f0", fontWeight: "600" },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
