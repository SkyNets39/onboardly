interface UserChatBubbleProps {
  content: string;
  userInitials: string;
}

export function UserChatBubble({ content, userInitials }: UserChatBubbleProps) {
  const initials = userInitials.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex justify-end gap-2">
      <div
        className="max-w-[min(85%,calc(100%-2.5rem))] rounded-2xl border border-(--user-bubble-border) bg-(--user-bubble-background) px-4 py-3 text-sm leading-6 text-(--user-bubble-foreground)"
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-(--user-bubble-border) bg-(--user-bubble-background) text-xs font-semibold text-(--user-bubble-foreground)"
        aria-hidden
      >
        {initials}
      </div>
    </div>
  );
}
