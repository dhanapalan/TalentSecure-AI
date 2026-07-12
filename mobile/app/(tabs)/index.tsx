import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchDailyTarget, fetchGamification, fetchMyDrives } from "../../src/lib/queries";

export default function HomeScreen() {
  const gamification = useQuery({ queryKey: ["gamification"], queryFn: fetchGamification });
  const daily = useQuery({ queryKey: ["daily-target"], queryFn: fetchDailyTarget });
  const drives = useQuery({ queryKey: ["my-drives"], queryFn: fetchMyDrives });

  const refreshing = gamification.isFetching || daily.isFetching || drives.isFetching;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            gamification.refetch();
            daily.refetch();
            drives.refetch();
          }}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your progress</Text>
        <Text style={styles.stat}>Level {gamification.data?.level ?? 1}</Text>
        <Text style={styles.muted}>{gamification.data?.total_xp ?? 0} XP · Streak {gamification.data?.current_streak ?? 0} days</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily practice</Text>
        <Text style={styles.stat}>
          {daily.data?.completed_today ?? 0} / {daily.data?.target ?? 1} sessions
        </Text>
        <Text style={styles.muted}>
          {daily.data?.met ? "Goal met today!" : `${daily.data?.remaining ?? 0} remaining`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active exams</Text>
        {(drives.data ?? [])
          .filter((d: { session_status: string }) =>
            ["assigned", "in_progress"].includes(d.session_status),
          )
          .slice(0, 3)
          .map((d: { drive_id: string; drive_name: string; session_status: string }) => (
            <Text key={d.drive_id} style={styles.driveRow}>
              {d.drive_name} — {d.session_status.replace("_", " ")}
            </Text>
          ))}
        {!(drives.data ?? []).some((d: { session_status: string }) =>
          ["assigned", "in_progress"].includes(d.session_status),
        ) && <Text style={styles.muted}>No pending exams</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  cardTitle: { fontSize: 14, color: "#64748b", fontWeight: "600", marginBottom: 8 },
  stat: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  muted: { fontSize: 14, color: "#64748b", marginTop: 4 },
  driveRow: { fontSize: 15, color: "#334155", marginTop: 6 },
});
