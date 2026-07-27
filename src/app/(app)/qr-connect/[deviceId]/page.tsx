import { ConnectFromInvite } from "@/features/qr-connect";

type QrConnectInvitePageProps = {
	params: Promise<{ deviceId: string }>;
};

export default async function QrConnectInvitePage({
	params,
}: QrConnectInvitePageProps) {
	const { deviceId } = await params;

	return (
		<div className="flex h-full items-center justify-center p-6">
			<ConnectFromInvite deviceId={deviceId} />
		</div>
	);
}
