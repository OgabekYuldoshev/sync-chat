"use client";

import { MessageCircle, Radar, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";
import type { CurrentUser } from "@/shared/lib/get-current-user";

const NAV_ITEMS = [
	{ title: "Chats", href: "/", icon: MessageCircle },
	{ title: "Nearby", href: "/nearby", icon: Radar },
] as const;

type AppSidebarProps = {
	currentUser: CurrentUser;
};

export function AppSidebar({ currentUser }: AppSidebarProps) {
	const pathname = usePathname();

	return (
		<aside className="hidden w-[72px] shrink-0 flex-col items-center justify-between border-border border-r bg-sidebar py-4 md:flex">
			<div className="flex flex-col items-center gap-6">
				<Link
					href="/"
					className="flex size-9 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground text-sm"
				>
					P
				</Link>

				<nav className="flex flex-col items-center gap-1">
					{NAV_ITEMS.map((item) => {
						const isActive = pathname === item.href;
						const Icon = item.icon;

						return (
							<Tooltip key={item.href}>
								<TooltipTrigger
									render={
										<Link
											href={item.href}
											aria-label={item.title}
											className={cn(
												"flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
												isActive && "bg-sidebar-accent text-primary",
											)}
										/>
									}
								>
									<Icon className="size-5" />
								</TooltipTrigger>
								<TooltipContent side="right">{item.title}</TooltipContent>
							</Tooltip>
						);
					})}
				</nav>
			</div>

			<div className="flex flex-col items-center gap-3">
				<Tooltip>
					<TooltipTrigger
						render={
							<Link
								href="/settings"
								aria-label="Settings"
								className={cn(
									"flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
									pathname === "/settings" && "bg-sidebar-accent text-primary",
								)}
							/>
						}
					>
						<Settings className="size-5" />
					</TooltipTrigger>
					<TooltipContent side="right">Settings</TooltipContent>
				</Tooltip>

				<Link href="/profile" aria-label="Your profile">
					<AvatarWithStatus user={currentUser} />
				</Link>
			</div>
		</aside>
	);
}
