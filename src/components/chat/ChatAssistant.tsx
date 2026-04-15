import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

import { AIChatBubble } from "@/components/chat/AIChatBubble";
import { UserChatBubble } from "@/components/chat/UserChatBubble";
import type { ChatFunctionResponse, ChatMessage, ChatSource } from "@/components/chat/chat-types";
import { Button } from "@/components/ui/button";

interface ChatAssistantProps {
  userName: string;
}

const CHAT_FUNCTION_URL = "https://zbsymtyiuylfytztvyec.supabase.co/functions/v1/chat";
const COMPANY_ID = "060d9407-1746-4f6c-aafe-02d5f3e88891";

function normalizeSources(payload: unknown): ChatSource[] {
  if (!Array.isArray(payload)) return [];

  const normalized: ChatSource[] = [];
  for (const candidate of payload) {
    if (candidate === null || typeof candidate !== "object") continue;
    if (
      !("document_id" in candidate) ||
      !("content_preview" in candidate) ||
      !("similarity" in candidate)
    ) {
      continue;
    }

    const { document_id, content_preview, similarity } = candidate;
    if (
      typeof document_id === "string" &&
      typeof content_preview === "string" &&
      typeof similarity === "number"
    ) {
      normalized.push({ document_id, content_preview, similarity });
    }
  }

  return normalized;
}

function parseChatFunctionResponse(payload: unknown): ChatFunctionResponse | null {
  if (payload === null || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const answer = candidate.answer;
  if (typeof answer !== "string" || answer.trim().length === 0) return null;

  return {
    answer,
    sources: normalizeSources(candidate.sources),
  };
}

async function askChatFunction({
  prompt,
  sessionId,
}: {
  prompt: string;
  sessionId: string;
}): Promise<ChatFunctionResponse> {
  const response = await fetch(CHAT_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      query: prompt,
      company_id: COMPANY_ID,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    let detail = "Unable to contact chat service.";
    try {
      const errorPayload = (await response.json()) as Record<string, unknown>;
      const errorMessage =
        typeof errorPayload.error === "string"
          ? errorPayload.error
          : typeof errorPayload.message === "string"
            ? errorPayload.message
            : null;
      if (errorMessage) detail = errorMessage;
    } catch {
      // Keep default message when body parsing fails.
    }
    throw new Error(detail);
  }

  const payload = (await response.json()) as unknown;
  const parsed = parseChatFunctionResponse(payload);
  if (!parsed) throw new Error("Chat service returned an unexpected response.");
  return parsed;
}

function buildMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatAssistant({ userName }: ChatAssistantProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const greeting = useMemo(
    () =>
      `Hi ${userName}. Ask me anything about your company policies or onboarding process. I will answer based on HR-approved documents.`,
    [userName],
  );

  useEffect(() => {
    setMessages([
      {
        id: buildMessageId(),
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [greeting]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function submitPrompt(rawPrompt: string): Promise<void> {
    const prompt = rawPrompt.trim();
    if (!prompt || isSending) return;

    const userMessage: ChatMessage = {
      id: buildMessageId(),
      role: "user",
      content: prompt,
    };

    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await askChatFunction({
        prompt,
        sessionId: sessionIdRef.current,
      });
      setMessages((previous) => [
        ...previous,
        {
          id: buildMessageId(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(draft);
  }

  return (
    <section className="flex flex-col gap-4">
      <article className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm font-medium">Assistant Chat</p>
          <p className="text-sm text-muted-foreground">
            Ask policy and onboarding questions. Responses are grounded on
            uploaded HR docs.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
          {messages.map((message) =>
            message.role === "assistant" ? (
              <AIChatBubble
                key={message.id}
                content={message.content}
                sources={message.sources}
              />
            ) : (
              <UserChatBubble key={message.id} content={message.content} />
            ),
          )}

          {isSending ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 md:p-4"
        >
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a policy or onboarding question..."
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <Button
              type="submit"
              className="shrink-0"
              disabled={!draft.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendHorizonal className="size-4" />
              )}
              Send
            </Button>
          </div>
          {errorMessage ? (
            <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </form>
      </article>
    </section>
  );
}
