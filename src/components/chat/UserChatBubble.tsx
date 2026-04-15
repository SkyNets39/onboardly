import { User2 } from "lucide-react";

interface UserChatBubbleProps {
  content: string;
}

export function UserChatBubble({ content }: UserChatBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-80">
          <User2 className="size-3.5" />
          You
        </p>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
