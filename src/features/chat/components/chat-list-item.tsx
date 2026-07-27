import { Pin } from "lucide-react";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import type { Chat } from "@/features/chat/types/chat";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { cn } from "@/shared/lib/cn";
import { formatChatListTimestamp } from "@/shared/utils/format-date";

type ChatListItemProps = {
	chat: Chat;
	isActive?: boolean;
	onSelect?: (chatId: string) => void;
};

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
	function handleClick() {
		onSelect?.(chat.id);
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent",
				isActive && "bg-accent",
			)}
		>
			<AvatarWithStatus user={chat.participant} />

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className="truncate font-medium text-sm">
						{chat.participant.name}
					</span>
					<span className="shrink-0 text-muted-foreground text-xs">
						{formatChatListTimestamp(chat.lastMessageAt)}
					</span>
				</div>

				<div className="mt-0.5 flex items-center justify-between gap-2">
					{chat.isTyping ? (
						<TypingIndicator />
					) : (
						<span className="truncate text-muted-foreground text-sm">
							{chat.lastMessage}
						</span>
					)}

					<div className="flex shrink-0 items-center gap-1.5">
						{chat.isPinned && (
							<Pin className="size-3.5 text-muted-foreground" />
						)}
						{chat.unreadCount > 0 && (
							<span className="flex size-5 items-center justify-center rounded-full bg-primary font-medium text-[11px] text-primary-foreground">
								{chat.unreadCount}
							</span>
						)}
					</div>
				</div>
			</div>
		</button>
	);
}
