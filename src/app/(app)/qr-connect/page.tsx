import { QrCodeCard } from "@/features/qr-connect";

export default function QrConnectPage() {
	return (
		<div className="flex h-full items-center justify-center p-6">
			<QrCodeCard inviteLink="peerchat.app/invite/9f8c2e" />
		</div>
	);
}
