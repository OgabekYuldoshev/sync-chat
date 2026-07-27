import { headers } from "next/headers";
import { QrConnectTabs } from "@/features/qr-connect";
import { getCurrentUser } from "@/shared/lib/get-current-user";

export default async function QrConnectPage() {
	const currentUser = await getCurrentUser();
	const requestHeaders = await headers();
	const host = requestHeaders.get("host") ?? "localhost";
	const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
	const inviteLink = `${protocol}://${host}/qr-connect/${currentUser.deviceId}`;

	return (
		<div className="flex h-full items-center justify-center p-6">
			<QrConnectTabs inviteLink={inviteLink} />
		</div>
	);
}
