import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "../src/lib/auth";

export default function Index() {
  const { data: token, isLoading } = useQuery({
    queryKey: ["auth-token"],
    queryFn: getToken,
  });

  if (isLoading) return null;
  return <Redirect href={token ? "/(tabs)" : "/login"} />;
}
