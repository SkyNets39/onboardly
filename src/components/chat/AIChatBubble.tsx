import { Bot } from "lucide-react";

import type { ChatSource } from "@/components/chat/chat-types";

interface AIChatBubbleProps {
  content: string;
  sources?: ChatSource[];
}

export function AIChatBubble({ content, sources }: AIChatBubbleProps) {
  return (
    <div className="flex justify-start gap-2">
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-(--bot-profile-border) bg-(--bot-profile-background) text-(--bot-profile-foreground)"
        aria-hidden
      >
        <Bot className="size-4 shrink-0" aria-hidden />
      </div>
      <div className="max-w-[min(85%,calc(100%-2.5rem))] rounded-2xl border border-(--bot-bubble-border) bg-(--bot-bubble-background) px-4 py-3 text-sm leading-6 text-(--bot-bubble-foreground)">
        <p className="whitespace-pre-wrap">{content}</p>
        {sources && sources.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sources.map((source) => (
              <span
                key={`${source.document_id}-${source.content_preview}`}
                className="inline-flex max-w-full items-center rounded-full border border-(--citation-border) bg-(--citation-background) px-2 py-0.5 text-[11px] text-(--citation-foreground)"
                title={`Similarity: ${source.similarity.toFixed(2)}`}
              >
                {source.content_preview}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
