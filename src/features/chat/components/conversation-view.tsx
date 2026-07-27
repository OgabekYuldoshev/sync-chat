"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConversationHeader } from "@/features/chat/components/conversation-header";
import { FloatingScrollButton } from "@/features/chat/components/floating-scroll-button";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { MessageComposer } from "@/features/chat/components/message-composer";
import { TransferProgressBanner } from "@/features/chat/components/transfer-progress-banner";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import {
	audioBlobToAttachment,
	fileToAttachment,
} from "@/features/chat/services/file-attachment";
import { SMALL_ATTACHMENT_MAX_BYTES } from "@/features/chat/services/file-transfer-protocol";
import { sendFileChunked } from "@/features/chat/services/file-transfer-sender";
import { sendMessage } from "@/features/chat/services/message-service";
import type { Chat } from "@/features/chat/types/chat";
import type { Message } from "@/features/chat/types/message";
import { EmptyState } from "@/shared/components/empty-state";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

type ConversationViewProps = {
	chat: Chat;
	messages: Message[];
	onBack?: () => void;
};

const BOTTOM_THRESHOLD_PX = 120;

export function ConversationView({
	chat,
	messages,
	onBack,
}: ConversationViewProps) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const isAtBottomRef = useRef(true);
	const previousMessageCountRef = useRef(messages.length);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [newMessagesCount, setNewMessagesCount] = useState(0);

	function isNearBottom() {
		const viewport = viewportRef.current;
		if (!viewport) {
			return true;
		}
		const distanceFromBottom =
			viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
		return distanceFromBottom <= BOTTOM_THRESHOLD_PX;
	}

	function scrollToBottom(behavior: ScrollBehavior = "auto") {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		viewport.scrollTo({ top: viewport.scrollHeight, behavior });
		isAtBottomRef.current = true;
	}

	function handleScroll() {
		const atBottom = isNearBottom();
		isAtBottomRef.current = atBottom;
		setShowScrollButton(!atBottom);
		if (atBottom) {
			setNewMessagesCount(0);
		}
	}

	function handleScrollButtonClick() {
		scrollToBottom("smooth");
		setShowScrollButton(false);
		setNewMessagesCount(0);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to last message on chat switch
	useLayoutEffect(() => {
		previousMessageCountRef.current = messages.length;
		scrollToBottom("auto");
		setShowScrollButton(false);
		setNewMessagesCount(0);
	}, [chat.id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when new messages arrive
	useEffect(() => {
		const previousCount = previousMessageCountRef.current;
		const arrivedCount = messages.length - previousCount;
		previousMessageCountRef.current = messages.length;

		if (arrivedCount <= 0) {
			return;
		}

		if (isAtBottomRef.current) {
			scrollToBottom("smooth");
		} else {
			setNewMessagesCount((count) => count + arrivedCount);
			setShowScrollButton(true);
		}
	}, [messages.length]);

	function handleSend(content: string) {
		sendMessage(chat.id, { content }).catch(() => {
			toast.error("Message couldn't be sent. Check your connection.");
		});
	}

	async function handleSendFile(file: File) {
		if (file.size > SMALL_ATTACHMENT_MAX_BYTES) {
			try {
				await sendFileChunked(chat.id, file);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Couldn't send file.",
				);
			}
			return;
		}

		try {
			const attachment = await fileToAttachment(file);
			await sendMessage(chat.id, { attachment });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Couldn't send file.",
			);
		}
	}

	async function handleSendAudio(blob: Blob, durationSeconds: number) {
		try {
			const attachment = await audioBlobToAttachment(blob, durationSeconds);
			await sendMessage(chat.id, { attachment });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Couldn't send voice message.",
			);
		}
	}

	return (
		<div className="flex h-full min-w-0 flex-1 flex-col">
			<ConversationHeader chat={chat} onBack={onBack} />

			<div className="relative min-h-0 flex-1">
				<ScrollArea
					className="h-full"
					ref={viewportRef}
					viewportProps={{ onScroll: handleScroll }}
				>
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

				<FloatingScrollButton
					visible={showScrollButton}
					unreadCount={newMessagesCount}
					onClick={handleScrollButtonClick}
				/>
			</div>

			<TransferProgressBanner peerId={chat.id} />

			<MessageComposer
				onSend={handleSend}
				onSendFile={handleSendFile}
				onSendAudio={handleSendAudio}
			/>
		</div>
	);
}
