import type { User } from "@/shared/types/user";

export type Chat = {
	id: string;
	participant: User;
	lastMessage: string;
	lastMessageAt: string;
	unreadCount: number;
	isPinned: boolean;
	isTyping: boolean;
};
