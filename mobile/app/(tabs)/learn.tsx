import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchEnrollments } from "../../src/lib/queries";
import type { Enrollment } from "../../src/types";

export default function LearnScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["enrollments"],
    queryFn: fetchEnrollments,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={(data as Enrollment[]) ?? []}
        keyExtractor={(item) => item.enrollment_id}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={styles.empty}>No enrolled programs yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/learn/${item.program_id}`)}
          >
            <Text style={styles.title}>{item.program_name}</Text>
            <Text style={styles.muted}>
              {item.completed_modules}/{item.total_modules} modules complete
            </Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.total_modules ? (item.completed_modules / item.total_modules) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: { backgroundColor: "#fff", margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  muted: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: "#2563eb" },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
});
