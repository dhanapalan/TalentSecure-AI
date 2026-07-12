import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMyDrives, startExamSession } from "../../src/lib/queries";
import type { Drive } from "../../src/types";

export default function ExamInstructionsScreen() {
  const { driveId } = useLocalSearchParams<{ driveId: string }>();
  const router = useRouter();
  const { data: drives, isLoading } = useQuery({
    queryKey: ["my-drives"],
    queryFn: fetchMyDrives,
  });

  const drive = (drives as Drive[] | undefined)?.find((d) => d.drive_id === driveId);

  const beginExam = async () => {
    try {
      await startExamSession(driveId!);
      router.push(`/exam/${driveId}/play`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start exam";
      Alert.alert("Cannot start", msg);
    }
  };

  if (isLoading || !drive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{drive.drive_name}</Text>
      <Text style={styles.rule}>{drive.rule_name}</Text>

      <View style={styles.card}>
        <Text style={styles.bullet}>• {drive.total_questions} MCQ questions</Text>
        <Text style={styles.bullet}>• {drive.duration_minutes} minutes total</Text>
        <Text style={styles.bullet}>• Front camera required for proctoring</Text>
        <Text style={styles.bullet}>• Do not leave the app during the exam</Text>
        <Text style={styles.bullet}>• Switching apps may be flagged as a violation</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={beginExam}>
        <Text style={styles.buttonText}>
          {drive.session_status === "in_progress" ? "Resume exam" : "Start exam"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  rule: { fontSize: 15, color: "#64748b", marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 24 },
  bullet: { fontSize: 15, color: "#334155", marginBottom: 8, lineHeight: 22 },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
