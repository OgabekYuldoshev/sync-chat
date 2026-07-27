import { AppShellLayout } from "@/layouts/app-shell-layout";
import { SignalingProvider } from "@/providers/signaling-provider";
import { getCurrentUser } from "@/shared/lib/get-current-user";

type AppGroupLayoutProps = {
	children: React.ReactNode;
};

export default async function AppGroupLayout({
	children,
}: AppGroupLayoutProps) {
	const currentUser = await getCurrentUser();

	return (
		<SignalingProvider>
			<AppShellLayout currentUser={currentUser}>{children}</AppShellLayout>
		</SignalingProvider>
	);
}
