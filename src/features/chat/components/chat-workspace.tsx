"use client";

import { MessageCircle } from "lucide-react";
import { ChatList } from "@/features/chat/components/chat-list";
import { ConversationView } from "@/features/chat/components/conversation-view";
import type { Chat } from "@/features/chat/types/chat";
import type { Message } from "@/features/chat/types/message";
import { EmptyState } from "@/shared/components/empty-state";
import { cn } from "@/shared/lib/cn";
import { useChatUiStore } from "@/shared/store/chat-ui-store";

type ChatWorkspaceProps = {
	chats: Chat[];
	messages: Message[];
};

export function ChatWorkspace({ chats, messages }: ChatWorkspaceProps) {
	const activeChatId = useChatUiStore((state) => state.activeChatId);
	const setActiveChatId = useChatUiStore((state) => state.setActiveChatId);

	const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];

	function handleBack() {
		setActiveChatId(null);
	}

	return (
		<div className="flex h-full w-full">
			<div
				className={cn("w-full md:w-auto", activeChatId && "hidden md:block")}
			>
				<ChatList
					chats={chats}
					activeChatId={activeChatId ?? undefined}
					onSelectChat={setActiveChatId}
				/>
			</div>

			<div
				className={cn("hidden min-w-0 flex-1 md:flex", activeChatId && "flex")}
			>
				{activeChat ? (
					<ConversationView
						chat={activeChat}
						messages={messages}
						onBack={handleBack}
					/>
				) : (
					<div className="flex flex-1 items-center justify-center">
						<EmptyState
							icon={MessageCircle}
							title="No conversations yet"
							description="Connect with someone nearby or via invite link to start chatting."
						/>
					</div>
				)}
			</div>
		</div>
	);
}
