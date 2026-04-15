import { Bot } from "lucide-react";

import type { ChatSource } from "@/components/chat/chat-types";

interface AIChatBubbleProps {
  content: string;
  sources?: ChatSource[];
}

export function AIChatBubble({ content, sources }: AIChatBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-80">
          <Bot className="size-3.5" />
          Onboardly
        </p>
        <p className="whitespace-pre-wrap">{content}</p>
        {sources && sources.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sources.map((source) => (
              <span
                key={`${source.document_id}-${source.content_preview}`}
                className="inline-flex max-w-full items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
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
