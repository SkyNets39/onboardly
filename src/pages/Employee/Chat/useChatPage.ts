import { useAuth } from "@/hooks/useAuth";

export function useChatPage() {
  const { profile } = useAuth();
  return { userName: profile?.full_name ?? "there" };
}
