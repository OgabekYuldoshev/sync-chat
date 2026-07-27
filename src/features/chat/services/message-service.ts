import { useMessagesStore } from "@/features/chat/store/messages-store";
import type { Message } from "@/features/chat/types/message";
import { importPeerPublicKey } from "@/shared/lib/crypto/keypair";
import { encryptPayload } from "@/shared/lib/crypto/message-cipher";
import { getSessionKey } from "@/shared/lib/crypto/session-key";
import { signalingClient } from "@/shared/lib/ws/signaling-client";
import {
	useContactsStore,
	waitForContactsHydration,
} from "@/shared/store/contacts-store";
import { isPeerConnected, sendToPeer } from "@/shared/store/peer-store";
import { useSignalingStore } from "@/shared/store/signaling-store";

/**
 * Encrypts and sends a text message to a known contact. Delivered directly
 * over the WebRTC DataChannel when the peer is connected; otherwise handed
 * to the signaling server as an opaque ciphertext blob for store-and-forward
 * delivery once the peer reconnects.
 */
export async function sendMessage(
	peerId: string,
	content: string,
): Promise<void> {
	await waitForContactsHydration();
	const contact = useContactsStore.getState().contacts[peerId];
	if (!contact) {
		throw new Error("Cannot message a peer that is not a known contact");
	}

	const selfId = useSignalingStore.getState().selfId;
	if (!selfId) {
		throw new Error("Not connected to the signaling server yet");
	}

	const message: Message = {
		id: crypto.randomUUID(),
		senderId: selfId,
		isOwn: true,
		content,
		attachment: null,
		createdAt: new Date().toISOString(),
		status: "sent",
	};

	useMessagesStore.getState().appendMessage(peerId, message);

	const publicKey = await importPeerPublicKey(contact.publicKeyBase64);
	const sessionKey = await getSessionKey(peerId, publicKey);
	const envelope = await encryptPayload(sessionKey, message);

	if (isPeerConnected(peerId)) {
		sendToPeer(peerId, JSON.stringify(envelope));
		return;
	}

	signalingClient.send({ type: "relay-message", to: peerId, envelope });
}
