import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, ArrowUp } from "lucide-react";

import { AIChatBubble } from "@/components/chat/AIChatBubble";
import { UserChatBubble } from "@/components/chat/UserChatBubble";
import type {
  ChatFunctionResponse,
  ChatMessage,
  ChatSource,
} from "@/components/chat/chat-types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatAssistantProps {
  userName: string;
}

const CHAT_FUNCTION_URL =
  "https://zbsymtyiuylfytztvyec.supabase.co/functions/v1/chat";

/** Single-line visual height (matches previous input). */
const CHAT_INPUT_MIN_HEIGHT_PX = 40;
/** Cap growth before scrolling inside the field. */
const CHAT_INPUT_MAX_HEIGHT_PX = 192;

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

function parseChatFunctionResponse(
  payload: unknown,
): ChatFunctionResponse | null {
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
  companyId,
}: {
  prompt: string;
  sessionId: string;
  companyId: string;
}): Promise<ChatFunctionResponse> {
  const response = await fetch(CHAT_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      query: prompt,
      company_id: companyId,
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

function chatInitialsFromDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const word = parts[0]!;
    return word.length === 1
      ? word.toUpperCase()
      : (word[0]! + word[1]!).toUpperCase();
  }
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return (first + last).toUpperCase();
}

export function ChatAssistant({ userName }: ChatAssistantProps) {
  const { profile } = useAuth();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
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

  useLayoutEffect(() => {
    const el = draftInputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(
      Math.max(el.scrollHeight, CHAT_INPUT_MIN_HEIGHT_PX),
      CHAT_INPUT_MAX_HEIGHT_PX,
    );
    el.style.height = `${next}px`;
  }, [draft]);

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
        companyId: profile?.company_id ?? "",
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

  const canSubmit = Boolean(draft.trim()) && !isSending;
  const userInitials = useMemo(
    () => chatInitialsFromDisplayName(userName),
    [userName],
  );

  return (
    <section className="flex flex-col gap-4 items-center py-6">
      <article className="flex h-[650px] w-full mx-auto max-w-4xl flex-col overflow-hidden ">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
          {messages.map((message) =>
            message.role === "assistant" ? (
              <AIChatBubble
                key={message.id}
                content={message.content}
                sources={message.sources}
              />
            ) : (
              <UserChatBubble
                key={message.id}
                content={message.content}
                userInitials={userInitials}
              />
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
          className="border border-border border-neutral-border p-3 px-2 rounded-4xl md:p-3 md:px-3 mx-4 bg-neutral-base"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={draftInputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                if (!draft.trim() || isSending) return;
                void submitPrompt(draft);
              }}
              placeholder="Ask a policy or onboarding question..."
              rows={1}
              aria-label="Message"
              className={cn(
                "min-h-10 w-full resize-none overflow-y-auto rounded-lg border-0 bg-background px-3 py-2 text-sm leading-snug shadow-none outline-none ring-0 placeholder:text-muted-foreground",
              )}
              style={{
                minHeight: CHAT_INPUT_MIN_HEIGHT_PX,
                maxHeight: CHAT_INPUT_MAX_HEIGHT_PX,
              }}
            />

            <Button
              size="icon-lg"
              type="submit"
              className={cn(
                "shrink-0 rounded-full",
                canSubmit
                  ? "bg-primary-400 text-white hover:bg-primary-500 hover:cursor-pointer"
                  : "bg-muted text-muted-foreground",
              )}
              disabled={!canSubmit}
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-6" />
              )}
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
