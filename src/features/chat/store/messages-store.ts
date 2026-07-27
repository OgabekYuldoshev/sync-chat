import { create } from "zustand";
import { isFileTransferControlMessage } from "@/features/chat/services/file-transfer-protocol";
import {
	getMessagesForPeer,
	saveMessage,
} from "@/features/chat/services/message-history-db";
import type { Message } from "@/features/chat/types/message";
import { importPeerPublicKey } from "@/shared/lib/crypto/keypair";
import { decryptPayload } from "@/shared/lib/crypto/message-cipher";
import { getSessionKey } from "@/shared/lib/crypto/session-key";
import { signalingClient } from "@/shared/lib/ws/signaling-client";
import type { EncryptedEnvelope } from "@/shared/lib/ws/signaling-protocol";
import { useChatUiStore } from "@/shared/store/chat-ui-store";
import {
	useContactsStore,
	waitForContactsHydration,
} from "@/shared/store/contacts-store";
import { onPeerData } from "@/shared/store/peer-store";

type MessagesStore = {
	messagesByPeer: Record<string, Message[]>;
	unreadByPeer: Record<string, number>;
	loadMessages: (peerId: string) => Promise<void>;
	appendMessage: (peerId: string, message: Message) => void;
	markRead: (peerId: string) => void;
};

export const useMessagesStore = create<MessagesStore>((set, get) => ({
	messagesByPeer: {},
	unreadByPeer: {},

	async loadMessages(peerId) {
		if (get().messagesByPeer[peerId]) {
			return;
		}
		const messages = await getMessagesForPeer(peerId);

		set((state) => {
			// A live message (P2P or relay) may have arrived while this
			// history read was in flight — never clobber it with the
			// (now stale) persisted snapshot.
			if (state.messagesByPeer[peerId]) {
				return state;
			}
			return {
				messagesByPeer: { ...state.messagesByPeer, [peerId]: messages },
			};
		});
	},

	appendMessage(peerId, message) {
		const isViewingThisPeer = useChatUiStore.getState().activeChatId === peerId;

		set((state) => ({
			messagesByPeer: {
				...state.messagesByPeer,
				[peerId]: [...(state.messagesByPeer[peerId] ?? []), message],
			},
			unreadByPeer:
				!message.isOwn && !isViewingThisPeer
					? {
							...state.unreadByPeer,
							[peerId]: (state.unreadByPeer[peerId] ?? 0) + 1,
						}
					: state.unreadByPeer,
		}));

		void saveMessage(peerId, message);
	},

	markRead(peerId) {
		set((state) => ({ unreadByPeer: { ...state.unreadByPeer, [peerId]: 0 } }));
	},
}));

/**
 * Decrypts a message from a known contact. The envelope carries the sender's
 * own copy of the message (with their `isOwn: true`), so the receiver side
 * always overrides `isOwn`/`senderId` from its own point of view rather than
 * trusting the sender's copy verbatim.
 */
async function decryptEnvelopeFromContact(
	peerId: string,
	envelope: EncryptedEnvelope,
): Promise<Message | null> {
	await waitForContactsHydration();
	const contact = useContactsStore.getState().contacts[peerId];
	if (!contact) {
		return null;
	}

	const publicKey = await importPeerPublicKey(contact.publicKeyBase64);
	const sessionKey = await getSessionKey(peerId, publicKey);
	const decrypted = await decryptPayload<Message>(sessionKey, envelope);

	return { ...decrypted, isOwn: false, senderId: peerId };
}

onPeerData(async (peerId, data) => {
	if (typeof data !== "string") {
		return; // binary chunk — belongs to the file-transfer protocol, not a chat envelope
	}

	try {
		const parsed = JSON.parse(data);
		if (isFileTransferControlMessage(parsed)) {
			return; // handled by file-transfer-receiver's own onPeerData subscription
		}

		const message = await decryptEnvelopeFromContact(
			peerId,
			parsed as EncryptedEnvelope,
		);
		if (message) {
			useMessagesStore.getState().appendMessage(peerId, message);
		}
	} catch (error) {
		console.error("Failed to decrypt incoming P2P message", error);
	}
});

signalingClient.on("relay-message", async (relayMessage) => {
	try {
		const message = await decryptEnvelopeFromContact(
			relayMessage.from,
			relayMessage.envelope,
		);
		if (message) {
			useMessagesStore.getState().appendMessage(relayMessage.from, message);
		}
	} catch (error) {
		console.error("Failed to decrypt relayed message", error);
	} finally {
		signalingClient.send({
			type: "relay-ack",
			messageId: relayMessage.messageId,
		});
	}
});
