"use client";

import { MessageCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ChatListItem } from "@/features/chat/components/chat-list-item";
import type { Chat } from "@/features/chat/types/chat";
import { EmptyState } from "@/shared/components/empty-state";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

type ChatListProps = {
	chats: Chat[];
	activeChatId?: string;
	onSelectChat?: (chatId: string) => void;
};

export function ChatList({ chats, activeChatId, onSelectChat }: ChatListProps) {
	const [query, setQuery] = useState("");

	const filteredChats = useMemo(() => {
		if (!query.trim()) {
			return chats;
		}

		const normalizedQuery = query.trim().toLowerCase();
		return chats.filter((chat) =>
			chat.participant.name.toLowerCase().includes(normalizedQuery),
		);
	}, [chats, query]);

	const pinnedChats = filteredChats.filter((chat) => chat.isPinned);
	const otherChats = filteredChats.filter((chat) => !chat.isPinned);

	return (
		<div className="flex h-full w-full flex-col border-border border-r md:w-[340px]">
			<div className="shrink-0 space-y-3 p-4">
				<h1 className="font-semibold text-lg">Chats</h1>
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search chats"
						className="pl-9"
					/>
				</div>
			</div>

			<ScrollArea className="min-h-0 flex-1">
				<div className="space-y-4 px-2 pb-4">
					{filteredChats.length === 0 && (
						<EmptyState
							icon={MessageCircle}
							title="No chats found"
							description="Try a different name or start a new conversation."
						/>
					)}

					{pinnedChats.length > 0 && (
						<div className="space-y-1">
							<p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Pinned
							</p>
							{pinnedChats.map((chat) => (
								<ChatListItem
									key={chat.id}
									chat={chat}
									isActive={chat.id === activeChatId}
									onSelect={onSelectChat}
								/>
							))}
						</div>
					)}

					{otherChats.length > 0 && (
						<div className="space-y-1">
							{pinnedChats.length > 0 && (
								<p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
									All chats
								</p>
							)}
							{otherChats.map((chat) => (
								<ChatListItem
									key={chat.id}
									chat={chat}
									isActive={chat.id === activeChatId}
									onSelect={onSelectChat}
								/>
							))}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
