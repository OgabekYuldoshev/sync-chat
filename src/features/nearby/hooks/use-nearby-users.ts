"use client";

import type { NearbyUser } from "@/features/nearby/types/nearby-user";
import { useContactsStore } from "@/shared/store/contacts-store";
import { usePeerStore } from "@/shared/store/peer-store";
import { useSignalingStore } from "@/shared/store/signaling-store";

/** Everyone currently reachable through the signaling server, i.e. "nearby" on this network. */
export function useNearbyUsers(): NearbyUser[] {
	const presence = useSignalingStore((state) => state.presence);
	const contacts = useContactsStore((state) => state.contacts);
	const connectionStates = usePeerStore((state) => state.connectionStates);

	return Object.values(presence).map(
		(peer): NearbyUser => ({
			id: peer.deviceId,
			name: peer.displayName,
			avatarUrl: null,
			status: "online",
			isConnected: Boolean(contacts[peer.deviceId]),
			isConnecting: connectionStates[peer.deviceId] === "connecting",
		}),
	);
}
