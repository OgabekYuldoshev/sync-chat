"use client";

import { useEffect } from "react";
import { useMessagesStore } from "@/features/chat/store/messages-store";
import type { Chat } from "@/features/chat/types/chat";
import { useContactsStore } from "@/shared/store/contacts-store";
import { useSignalingStore } from "@/shared/store/signaling-store";

const NO_MESSAGES_PREVIEW = "Say hello \u{1F44B}";

export function useChats(): Chat[] {
	const contacts = useContactsStore((state) => state.contacts);
	const presence = useSignalingStore((state) => state.presence);
	const messagesByPeer = useMessagesStore((state) => state.messagesByPeer);
	const unreadByPeer = useMessagesStore((state) => state.unreadByPeer);
	const loadMessages = useMessagesStore((state) => state.loadMessages);

	const contactIds = Object.keys(contacts);

	useEffect(() => {
		for (const deviceId of contactIds) {
			loadMessages(deviceId);
		}
	}, [contactIds, loadMessages]);

	return Object.values(contacts)
		.map((contact): Chat => {
			const messages = messagesByPeer[contact.deviceId] ?? [];
			const lastMessage = messages.at(-1);
			const isOnline = Boolean(presence[contact.deviceId]);

			return {
				id: contact.deviceId,
				participant: {
					id: contact.deviceId,
					name: contact.displayName,
					avatarUrl: null,
					status: isOnline ? "online" : "offline",
				},
				lastMessage: lastMessage
					? (lastMessage.content ??
						lastMessage.attachment?.name ??
						"Attachment")
					: NO_MESSAGES_PREVIEW,
				lastMessageAt: lastMessage?.createdAt ?? contact.addedAt,
				unreadCount: unreadByPeer[contact.deviceId] ?? 0,
				isPinned: false,
				isTyping: false,
			};
		})
		.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}
