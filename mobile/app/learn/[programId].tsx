import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProgramModules } from "../../src/lib/queries";
import { api } from "../../src/lib/api";
import type { LearningModule } from "../../src/types";

export default function ProgramDetailScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["program-modules", programId],
    queryFn: () => fetchProgramModules(programId!),
    enabled: !!programId,
  });

  const startModule = async (moduleId: string) => {
    try {
      await api.post(
        `/api/student-learning/my-enrollments/${programId}/modules/${moduleId}/start`,
      );
      refetch();
    } catch {
      /* ignore */
    }
  };

  const completeModule = async (moduleId: string) => {
    try {
      await api.post(
        `/api/student-learning/my-enrollments/${programId}/modules/${moduleId}/complete`,
        { score: 100 },
      );
      refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={(data as LearningModule[]) ?? []}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted}>
              {item.module_type} · {item.duration_minutes ?? "?"} min · {item.progress_status ?? "not started"}
            </Text>
            {item.content_url ? (
              <Text style={styles.link} numberOfLines={2}>
                {item.content_url}
              </Text>
            ) : null}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => startModule(item.id)}>
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => completeModule(item.id)}>
                <Text style={[styles.btnText, styles.btnTextPrimary]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: { backgroundColor: "#fff", margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
  title: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 13, color: "#64748b", marginTop: 4 },
  link: { fontSize: 12, color: "#2563eb", marginTop: 6 },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  btnText: { fontWeight: "600", color: "#334155" },
  btnTextPrimary: { color: "#fff" },
});
