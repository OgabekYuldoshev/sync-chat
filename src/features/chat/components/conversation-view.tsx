"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ConversationHeader } from "@/features/chat/components/conversation-header";
import { FloatingScrollButton } from "@/features/chat/components/floating-scroll-button";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { MessageComposer } from "@/features/chat/components/message-composer";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import type { Chat } from "@/features/chat/types/chat";
import type { Message } from "@/features/chat/types/message";
import { EmptyState } from "@/shared/components/empty-state";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

type ConversationViewProps = {
	chat: Chat;
	messages: Message[];
	onBack?: () => void;
};

export function ConversationView({
	chat,
	messages,
	onBack,
}: ConversationViewProps) {
	const [showScrollButton] = useState(false);

	return (
		<div className="flex h-full min-w-0 flex-1 flex-col">
			<ConversationHeader chat={chat} onBack={onBack} />

			<div className="relative min-h-0 flex-1">
				<ScrollArea className="h-full">
					{messages.length === 0 ? (
						<EmptyState
							icon={MessageCircle}
							title="No messages yet"
							description={`Say hello to ${chat.participant.name}.`}
						/>
					) : (
						<div className="flex flex-col gap-3 p-4">
							{messages.map((message) => (
								<MessageBubble key={message.id} message={message} />
							))}

							{chat.isTyping && (
								<div className="rounded-2xl rounded-bl-md bg-surface px-3.5 py-3">
									<TypingIndicator />
								</div>
							)}
						</div>
					)}
				</ScrollArea>

				<FloatingScrollButton visible={showScrollButton} />
			</div>

			<MessageComposer />
		</div>
	);
}
