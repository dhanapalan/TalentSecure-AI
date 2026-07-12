import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="learn/[programId]" options={{ headerShown: true, title: "Program" }} />
        <Stack.Screen name="exam/[driveId]/instructions" options={{ headerShown: true, title: "Exam" }} />
        <Stack.Screen name="exam/[driveId]/play" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
