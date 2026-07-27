"use client";

import { Loader2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectionSuccess } from "@/features/qr-connect/components/connection-success";
import { EmptyState } from "@/shared/components/empty-state";
import { useChatUiStore } from "@/shared/store/chat-ui-store";
import { useContactsStore } from "@/shared/store/contacts-store";
import { connectToPeer } from "@/shared/store/peer-store";
import { useSignalingStore } from "@/shared/store/signaling-store";

const CONNECT_TIMEOUT_MS = 15_000;

type ConnectFromInviteProps = {
	deviceId: string;
};

export function ConnectFromInvite({ deviceId }: ConnectFromInviteProps) {
	const router = useRouter();
	const presencePeer = useSignalingStore((state) => state.presence[deviceId]);
	const contact = useContactsStore((state) => state.contacts[deviceId]);
	const setActiveChatId = useChatUiStore((state) => state.setActiveChatId);
	const [hasAttempted, setHasAttempted] = useState(false);
	const [timedOut, setTimedOut] = useState(false);

	useEffect(() => {
		if (!presencePeer || hasAttempted) {
			return;
		}
		setHasAttempted(true);
		connectToPeer(deviceId).catch(() => {});
	}, [presencePeer, hasAttempted, deviceId]);

	useEffect(() => {
		if (contact) {
			return;
		}
		const timer = setTimeout(() => setTimedOut(true), CONNECT_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [contact]);

	function handleStartChat() {
		setActiveChatId(deviceId);
		router.push("/");
	}

	if (contact) {
		return (
			<ConnectionSuccess
				user={{
					id: contact.deviceId,
					name: contact.displayName,
					avatarUrl: null,
					status: "online",
				}}
				onStartChat={handleStartChat}
			/>
		);
	}

	if (!presencePeer) {
		return (
			<EmptyState
				icon={UserX}
				title="Not available right now"
				description="This person isn't online. Ask them to open PeerChat and try the invite again."
			/>
		);
	}

	if (timedOut) {
		return (
			<EmptyState
				icon={UserX}
				title="Connection timed out"
				description="Couldn't establish a connection. Check your network and try again."
			/>
		);
	}

	return (
		<div className="flex flex-col items-center gap-3 p-8 text-center">
			<Loader2 className="size-8 animate-spin text-primary" />
			<p className="text-muted-foreground text-sm">Connecting...</p>
		</div>
	);
}
