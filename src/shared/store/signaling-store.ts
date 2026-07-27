import { create } from "zustand";
import {
	exportPublicKeyBase64,
	getOrCreateDeviceKeyPair,
} from "@/shared/lib/crypto/keypair";
import { watchLocation } from "@/shared/lib/geolocation/watch-location";
import type { SignalingStatus } from "@/shared/lib/ws/signaling-client";
import { signalingClient } from "@/shared/lib/ws/signaling-client";
import type { PresencePeer } from "@/shared/lib/ws/signaling-protocol";

type SignalingStore = {
	status: SignalingStatus;
	selfId: string | null;
	presence: Record<string, PresencePeer>;
};

export const useSignalingStore = create<SignalingStore>(() => ({
	status: "idle",
	selfId: null,
	presence: {},
}));

let stopWatchingLocation: (() => void) | null = null;

signalingClient.onStatusChange((status) => {
	useSignalingStore.setState({ status });

	if (status === "open") {
		announcePublicKey();

		if (!stopWatchingLocation) {
			stopWatchingLocation = watchLocation((point) => {
				signalingClient.send({
					type: "location",
					lat: point.lat,
					lng: point.lng,
				});
			});
		}
	}
});

async function announcePublicKey(): Promise<void> {
	const { publicKey } = await getOrCreateDeviceKeyPair();
	const publicKeyBase64 = await exportPublicKeyBase64(publicKey);
	signalingClient.send({ type: "hello", publicKey: publicKeyBase64 });
}

signalingClient.on("welcome", (message) => {
	useSignalingStore.setState({ selfId: message.deviceId });
});

signalingClient.on("presence", (message) => {
	const presence: Record<string, PresencePeer> = {};
	for (const peer of message.peers) {
		presence[peer.deviceId] = peer;
	}
	useSignalingStore.setState({ presence });
});
