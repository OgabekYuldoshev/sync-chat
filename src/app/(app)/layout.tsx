import { AppShellLayout } from "@/layouts/app-shell-layout";
import { getCurrentUser } from "@/shared/lib/get-current-user";

type AppGroupLayoutProps = {
	children: React.ReactNode;
};

export default async function AppGroupLayout({
	children,
}: AppGroupLayoutProps) {
	const currentUser = await getCurrentUser();

	return <AppShellLayout currentUser={currentUser}>{children}</AppShellLayout>;
}
