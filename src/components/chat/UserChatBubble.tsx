interface UserChatBubbleProps {
  content: string;
  userInitials: string;
}

export function UserChatBubble({ content, userInitials }: UserChatBubbleProps) {
  const initials = userInitials.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[80%] bg-primary-600 px-3.5 py-2.5 text-[13.5px] font-medium leading-[1.55] text-white"
        style={{ borderRadius: "14px 14px 4px 14px" }}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-600 text-[11px] font-semibold text-white">
        {initials}
      </div>
    </div>
  );
}
