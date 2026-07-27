import { AppSidebar } from "@/shared/components/app-sidebar";
import { BottomNav } from "@/shared/components/bottom-nav";
import type { CurrentUser } from "@/shared/lib/get-current-user";

type AppShellLayoutProps = {
	children: React.ReactNode;
	currentUser: CurrentUser;
};

export function AppShellLayout({ children, currentUser }: AppShellLayoutProps) {
	return (
		<div className="flex h-dvh w-full overflow-hidden">
			<AppSidebar currentUser={currentUser} />
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="min-h-0 flex-1">{children}</main>
				<BottomNav />
			</div>
		</div>
	);
}
