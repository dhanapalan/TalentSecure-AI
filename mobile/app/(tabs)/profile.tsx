import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, clearSession } from "../../src/lib/auth";
import type { User } from "../../src/types";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUser<User>(),
  });

  const logout = async () => {
    await clearSession();
    await queryClient.clear();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name ?? "Student"}</Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
        <Text style={styles.role}>{user?.role ?? "student"}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          Alert.alert("Sign out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: logout },
          ])
        }
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 16 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  email: { fontSize: 15, color: "#64748b", marginTop: 4 },
  role: { fontSize: 13, color: "#2563eb", marginTop: 8, textTransform: "capitalize" },
  button: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
