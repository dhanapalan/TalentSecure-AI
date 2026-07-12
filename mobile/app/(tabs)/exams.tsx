import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchMyDrives } from "../../src/lib/queries";
import type { Drive } from "../../src/types";

function statusColor(status: string) {
  if (status === "in_progress") return "#f59e0b";
  if (status === "completed") return "#22c55e";
  return "#2563eb";
}

export default function ExamsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-drives"],
    queryFn: fetchMyDrives,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={(data as Drive[]) ?? []}
        keyExtractor={(item) => item.drive_id}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={styles.empty}>No exams assigned</Text>}
        renderItem={({ item }) => {
          const canStart = ["assigned", "in_progress"].includes(item.session_status);
          return (
            <TouchableOpacity
              style={styles.card}
              disabled={!canStart}
              onPress={() => router.push(`/exam/${item.drive_id}/instructions`)}
            >
              <Text style={styles.title}>{item.drive_name}</Text>
              <Text style={styles.muted}>
                {item.total_questions} questions · {item.duration_minutes} min
              </Text>
              <Text style={[styles.badge, { color: statusColor(item.session_status) }]}>
                {item.session_status.replace("_", " ")}
                {item.score != null ? ` · Score ${item.score}` : ""}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: { backgroundColor: "#fff", margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
  title: { fontSize: 17, fontWeight: "600" },
  muted: { fontSize: 14, color: "#64748b", marginTop: 4 },
  badge: { fontSize: 13, fontWeight: "600", marginTop: 8, textTransform: "capitalize" },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
});
