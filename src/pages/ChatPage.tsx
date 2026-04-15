import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const { profile } = useAuth();
  const userName = profile?.full_name ?? "there";

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Welcome back, {profile?.full_name}</h2>
        <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted-foreground">
          Ask any onboarding or policy question. Onboardly answers using HR-managed documents so
          you can get guidance quickly without waiting for manual support.
        </p>
      </div>
      <ChatAssistant userName={userName} />
    </section>
  );
}
