import { headers } from "next/headers";
import { ProfileHeader } from "@/features/profile";
import { QrCodeCard } from "@/features/qr-connect";
import { getCurrentUser } from "@/shared/lib/get-current-user";

export default async function ProfilePage() {
	const currentUser = await getCurrentUser();
	const requestHeaders = await headers();
	const host = requestHeaders.get("host") ?? "localhost";
	const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
	const inviteLink = `${protocol}://${host}/qr-connect/${currentUser.deviceId}`;

	return (
		<div className="mx-auto h-full w-full max-w-md overflow-y-auto">
			<ProfileHeader user={currentUser} />
			<div className="flex justify-center px-6 pb-10">
				<QrCodeCard inviteLink={inviteLink} />
			</div>
		</div>
	);
}
