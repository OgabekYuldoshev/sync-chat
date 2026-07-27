"use client";

import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { ChatList } from "@/features/chat/components/chat-list";
import { ConversationView } from "@/features/chat/components/conversation-view";
import { useChats } from "@/features/chat/hooks/use-chats";
import { useMessagesStore } from "@/features/chat/store/messages-store";
import { EmptyState } from "@/shared/components/empty-state";
import { cn } from "@/shared/lib/cn";
import { useChatUiStore } from "@/shared/store/chat-ui-store";

export function ChatWorkspace() {
	const chats = useChats();
	const activeChatId = useChatUiStore((state) => state.activeChatId);
	const setActiveChatId = useChatUiStore((state) => state.setActiveChatId);
	const messagesByPeer = useMessagesStore((state) => state.messagesByPeer);
	const markRead = useMessagesStore((state) => state.markRead);

	const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];
	const visibleChatId = activeChat?.id;

	useEffect(() => {
		if (visibleChatId) {
			markRead(visibleChatId);
		}
	}, [visibleChatId, markRead]);

	function handleBack() {
		setActiveChatId(null);
	}

	const messages = activeChat ? (messagesByPeer[activeChat.id] ?? []) : [];

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
