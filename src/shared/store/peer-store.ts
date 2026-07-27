import { toast } from "sonner";
import { create } from "zustand";
import { PeerConnection } from "@/shared/lib/webrtc/peer-connection";
import { signalingClient } from "@/shared/lib/ws/signaling-client";
import { useContactsStore } from "@/shared/store/contacts-store";
import { useSignalingStore } from "@/shared/store/signaling-store";

export type PeerConnectionState = "connecting" | "connected" | "closed";

type PeerStore = {
	connectionStates: Record<string, PeerConnectionState>;
};

export const usePeerStore = create<PeerStore>(() => ({
	connectionStates: {},
}));

const connections = new Map<string, PeerConnection>();
const pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
const pendingOffers = new Map<string, string>();
const dataHandlers = new Set<(peerId: string, data: string) => void>();

function setConnectionState(peerId: string, state: PeerConnectionState): void {
	usePeerStore.setState((previous) => ({
		connectionStates: { ...previous.connectionStates, [peerId]: state },
	}));

	if (state === "connected") {
		registerContactOnFirstConnect(peerId);
	}
}

function registerContactOnFirstConnect(peerId: string): void {
	const { contacts, addContact } = useContactsStore.getState();
	if (contacts[peerId]) {
		return;
	}

	const peer = useSignalingStore.getState().presence[peerId];
	if (!peer) {
		return;
	}

	addContact({
		deviceId: peerId,
		displayName: peer.displayName,
		publicKeyBase64: peer.publicKey,
		addedAt: new Date().toISOString(),
	});
}

function createConnection(
	peerId: string,
	isInitiator: boolean,
): PeerConnection {
	const connection = new PeerConnection({
		peerId,
		isInitiator,
		onIceCandidate: (candidate) => {
			signalingClient.send({
				type: "signal",
				to: peerId,
				signal: { kind: "ice-candidate", candidate },
			});
		},
		onDataChannelOpen: () => setConnectionState(peerId, "connected"),
		onDataChannelMessage: (data) => {
			for (const handler of dataHandlers) {
				handler(peerId, data);
			}
		},
		onClose: () => {
			connections.delete(peerId);
			pendingCandidates.delete(peerId);
			setConnectionState(peerId, "closed");
		},
	});

	connections.set(peerId, connection);
	setConnectionState(peerId, "connecting");
	return connection;
}

async function flushPendingCandidates(
	peerId: string,
	connection: PeerConnection,
): Promise<void> {
	const queue = pendingCandidates.get(peerId);
	if (!queue) {
		return;
	}

	for (const candidate of queue) {
		await connection.addIceCandidate(candidate);
	}
	pendingCandidates.delete(peerId);
}

async function answerOffer(peerId: string, sdp: string): Promise<void> {
	const connection = connections.get(peerId) ?? createConnection(peerId, false);
	const answer = await connection.createAnswer({ type: "offer", sdp });
	await flushPendingCandidates(peerId, connection);
	signalingClient.send({
		type: "signal",
		to: peerId,
		signal: { kind: "answer", sdp: answer.sdp ?? "" },
	});
}

/** Initiates a P2P connection to a peer discovered via presence. No-op if already connecting/connected. */
export async function connectToPeer(peerId: string): Promise<void> {
	if (connections.has(peerId)) {
		return;
	}

	const connection = createConnection(peerId, true);
	const offer = await connection.createOffer();

	signalingClient.send({
		type: "signal",
		to: peerId,
		signal: { kind: "offer", sdp: offer.sdp ?? "" },
	});
}

/** Accepts a pending incoming connection request shown via the toast prompt. */
export function acceptConnectionRequest(peerId: string): void {
	const sdp = pendingOffers.get(peerId);
	if (!sdp) {
		return;
	}
	pendingOffers.delete(peerId);
	answerOffer(peerId, sdp).catch((error) => {
		console.error("Failed to accept connection request", error);
	});
}

/** Declines a pending incoming connection request, notifying the requester. */
export function rejectConnectionRequest(peerId: string): void {
	if (!pendingOffers.delete(peerId)) {
		return;
	}
	signalingClient.send({
		type: "signal",
		to: peerId,
		signal: { kind: "reject" },
	});
}

export function sendToPeer(peerId: string, data: string): boolean {
	return connections.get(peerId)?.send(data) ?? false;
}

export function isPeerConnected(peerId: string): boolean {
	return connections.get(peerId)?.isDataChannelOpen ?? false;
}

export function onPeerData(
	handler: (peerId: string, data: string) => void,
): () => void {
	dataHandlers.add(handler);
	return () => {
		dataHandlers.delete(handler);
	};
}

signalingClient.on("signal", async (message) => {
	const { from, signal } = message;

	try {
		switch (signal.kind) {
			case "offer": {
				const isKnownContact = Boolean(
					useContactsStore.getState().contacts[from],
				);

				if (isKnownContact) {
					await answerOffer(from, signal.sdp);
					break;
				}

				pendingOffers.set(from, signal.sdp);
				const fromName =
					useSignalingStore.getState().presence[from]?.displayName ?? "Someone";

				toast(`${fromName} wants to connect`, {
					duration: 20_000,
					action: {
						label: "Accept",
						onClick: () => acceptConnectionRequest(from),
					},
					cancel: {
						label: "Decline",
						onClick: () => rejectConnectionRequest(from),
					},
				});
				break;
			}
			case "answer": {
				const connection = connections.get(from);
				if (!connection) {
					break;
				}
				await connection.acceptAnswer({ type: "answer", sdp: signal.sdp });
				await flushPendingCandidates(from, connection);
				break;
			}
			case "ice-candidate": {
				const connection = connections.get(from);
				if (!connection?.hasRemoteDescription) {
					const queue = pendingCandidates.get(from) ?? [];
					queue.push(signal.candidate);
					pendingCandidates.set(from, queue);
					break;
				}
				await connection.addIceCandidate(signal.candidate);
				break;
			}
			case "reject": {
				const connection = connections.get(from);
				connection?.close();
				connections.delete(from);
				pendingCandidates.delete(from);
				setConnectionState(from, "closed");

				const fromName =
					useSignalingStore.getState().presence[from]?.displayName ?? "They";
				toast.error(`${fromName} declined the connection request`);
				break;
			}
			default: {
				break;
			}
		}
	} catch (error) {
		console.error("Failed to handle WebRTC signal", error);
	}
});
