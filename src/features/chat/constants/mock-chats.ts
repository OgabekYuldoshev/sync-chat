import type { Chat } from "@/features/chat/types/chat";

export const MOCK_CHATS: Chat[] = [
	{
		id: "chat-1",
		participant: {
			id: "user-1",
			name: "Amelia Chen",
			avatarUrl: null,
			status: "online",
		},
		lastMessage: "Sent the final design files",
		lastMessageAt: "2026-07-27T09:41:00",
		unreadCount: 2,
		isPinned: true,
		isTyping: false,
	},
	{
		id: "chat-2",
		participant: {
			id: "user-2",
			name: "Diego Ramirez",
			avatarUrl: null,
			status: "online",
		},
		lastMessage: "typing...",
		lastMessageAt: "2026-07-27T09:38:00",
		unreadCount: 0,
		isPinned: true,
		isTyping: true,
	},
	{
		id: "chat-3",
		participant: {
			id: "user-3",
			name: "Priya Nair",
			avatarUrl: null,
			status: "away",
		},
		lastMessage: "Can you resend the invoice?",
		lastMessageAt: "2026-07-27T08:15:00",
		unreadCount: 0,
		isPinned: false,
		isTyping: false,
	},
	{
		id: "chat-4",
		participant: {
			id: "user-4",
			name: "Lucas Meyer",
			avatarUrl: null,
			status: "offline",
		},
		lastMessage: "Thanks, transfer complete 🎉",
		lastMessageAt: "2026-07-26T19:02:00",
		unreadCount: 0,
		isPinned: false,
		isTyping: false,
	},
];
