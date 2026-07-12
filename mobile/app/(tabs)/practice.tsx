import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchPracticeTopics, startPracticeSession } from "../../src/lib/queries";
import type { PracticeTopic } from "../../src/types";
import { api } from "../../src/lib/api";

export default function PracticeScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["practice-topics"],
    queryFn: fetchPracticeTopics,
  });
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [question, setQuestion] = useState<{
    id: string;
    question_text: string;
    options: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const startQuiz = async (topic: string) => {
    setLoading(true);
    try {
      const result = await startPracticeSession(topic);
      const session = result.session;
      setActiveSession(session.id);
      const q = result.questions?.[0];
      if (q) {
        setQuestion({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : Object.values(q.options ?? {}),
        });
      }
    } catch {
      Alert.alert("Error", "Could not start practice session");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!activeSession || !question) return;
    setLoading(true);
    try {
      await api.post(`/api/practice/sessions/${activeSession}/answer`, {
        question_id: question.id,
        student_answer: String(answerIndex),
      });
      await api.put(`/api/practice/sessions/${activeSession}/complete`);
      Alert.alert("Done", "Practice session completed!");
      setActiveSession(null);
      setQuestion(null);
      refetch();
    } catch {
      Alert.alert("Error", "Could not submit answer");
    } finally {
      setLoading(false);
    }
  };

  if (question) {
    return (
      <View style={styles.container}>
        <Text style={styles.question}>{question.question_text}</Text>
        {question.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.option}
            onPress={() => submitAnswer(i)}
            disabled={loading}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={(data as PracticeTopic[]) ?? []}
        keyExtractor={(item) => item.topic}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={styles.empty}>No practice topics available</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => startQuiz(item.topic)} disabled={loading}>
            <Text style={styles.title}>{item.topic}</Text>
            <Text style={styles.muted}>{item.total_questions} questions</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "600" },
  muted: { fontSize: 14, color: "#64748b", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
  question: { fontSize: 18, fontWeight: "600", marginBottom: 20, color: "#0f172a" },
  option: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionText: { fontSize: 16 },
});
