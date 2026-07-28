"use client";

import { MessageCircle, Radar, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { useChatUiStore } from "@/shared/store/chat-ui-store";

const NAV_ITEMS = [
	{ title: "Chats", href: "/", icon: MessageCircle },
	{ title: "Nearby", href: "/nearby", icon: Radar },
	{ title: "Profile", href: "/profile", icon: User },
] as const;

export function BottomNav() {
	const pathname = usePathname();
	const activeChatId = useChatUiStore((state) => state.activeChatId);

	const isConversationOpen = pathname === "/" && Boolean(activeChatId);

	return (
		<nav
			className={cn(
				"shrink-0 items-center justify-around border-border border-t bg-sidebar pb-safe md:hidden",
				isConversationOpen ? "hidden" : "flex pt-2",
			)}
		>
			{NAV_ITEMS.map((item) => {
				const isActive = pathname === item.href;
				const Icon = item.icon;

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground transition-colors",
							isActive && "text-primary",
						)}
					>
						<Icon className="size-5" />
						{item.title}
					</Link>
				);
			})}
		</nav>
	);
}
