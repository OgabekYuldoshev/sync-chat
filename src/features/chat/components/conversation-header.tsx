"use client";

import { ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import type { Chat } from "@/features/chat/types/chat";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { Button } from "@/shared/components/ui/button";

const STATUS_LABEL: Record<Chat["participant"]["status"], string> = {
	online: "Online",
	away: "Away",
	offline: "Offline",
};

type ConversationHeaderProps = {
	chat: Chat;
	onBack?: () => void;
};

export function ConversationHeader({ chat, onBack }: ConversationHeaderProps) {
	return (
		<div className="flex shrink-0 items-center justify-between border-border border-b px-4 py-3">
			<div className="flex min-w-0 items-center gap-3">
				{onBack && (
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label="Back to chats"
						onClick={onBack}
						className="md:hidden"
					>
						<ChevronLeft className="size-5" />
					</Button>
				)}

				<AvatarWithStatus user={chat.participant} />

				<div className="min-w-0">
					<p className="truncate font-medium text-sm">
						{chat.participant.name}
					</p>
					<p className="text-muted-foreground text-xs">
						{chat.isTyping
							? "typing..."
							: STATUS_LABEL[chat.participant.status]}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon-lg" aria-label="Voice call">
					<Phone className="size-5" />
				</Button>
				<Button variant="ghost" size="icon-lg" aria-label="Video call">
					<Video className="size-5" />
				</Button>
				<Button variant="ghost" size="icon-lg" aria-label="More options">
					<MoreVertical className="size-5" />
				</Button>
			</div>
		</div>
	);
}
