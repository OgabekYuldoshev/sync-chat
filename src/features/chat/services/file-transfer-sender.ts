import { saveAttachmentBlob } from "@/features/chat/services/attachment-blob-db";
import {
	CHUNK_SIZE_BYTES,
	type FileTransferControlMessage,
	inferAttachmentType,
	LARGE_ATTACHMENT_MAX_BYTES,
} from "@/features/chat/services/file-transfer-protocol";
import { useFileTransfersStore } from "@/features/chat/store/file-transfers-store";
import { useMessagesStore } from "@/features/chat/store/messages-store";
import type { Message } from "@/features/chat/types/message";
import { arrayBufferToBase64 } from "@/shared/lib/crypto/encoding";
import { importPeerPublicKey } from "@/shared/lib/crypto/keypair";
import { getSessionKey } from "@/shared/lib/crypto/session-key";
import {
	useContactsStore,
	waitForContactsHydration,
} from "@/shared/store/contacts-store";
import {
	isPeerConnected,
	sendToPeer,
	waitForPeerBufferedAmountLow,
} from "@/shared/store/peer-store";
import { useSignalingStore } from "@/shared/store/signaling-store";
import { formatFileSize } from "@/shared/utils/format-file-size";

function sendControl(
	peerId: string,
	message: FileTransferControlMessage,
): void {
	sendToPeer(peerId, JSON.stringify(message));
}

/**
 * Sends a large file as an encrypted chunk stream directly over the
 * DataChannel. Never buffers the whole file in memory (reads via
 * `file.slice().arrayBuffer()` per chunk) and never touches the relay —
 * the peer must be online for the whole transfer.
 */
export async function sendFileChunked(
	peerId: string,
	file: File,
): Promise<void> {
	if (!isPeerConnected(peerId)) {
		throw new Error("This person must be online to receive large files.");
	}
	if (file.size > LARGE_ATTACHMENT_MAX_BYTES) {
		throw new Error(
			`File is too large. Max size is ${formatFileSize(LARGE_ATTACHMENT_MAX_BYTES)}.`,
		);
	}

	await waitForContactsHydration();
	const contact = useContactsStore.getState().contacts[peerId];
	if (!contact) {
		throw new Error("Cannot message a peer that is not a known contact");
	}

	const selfId = useSignalingStore.getState().selfId;
	if (!selfId) {
		throw new Error("Not connected to the signaling server yet");
	}

	const publicKey = await importPeerPublicKey(contact.publicKeyBase64);
	const sessionKey = await getSessionKey(peerId, publicKey);

	const transferId = crypto.randomUUID();
	const mimeType = file.type || "application/octet-stream";
	const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);

	useFileTransfersStore.getState().startTransfer({
		transferId,
		peerId,
		direction: "send",
		name: file.name,
		totalBytes: file.size,
		transferredBytes: 0,
	});

	try {
		sendControl(peerId, {
			kind: "file-transfer-start",
			transferId,
			name: file.name,
			mimeType,
			totalSize: file.size,
			totalChunks,
		});

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
			const start = chunkIndex * CHUNK_SIZE_BYTES;
			const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
			const chunkBuffer = await file.slice(start, end).arrayBuffer();

			const iv = crypto.getRandomValues(new Uint8Array(12));
			const ciphertext = await crypto.subtle.encrypt(
				{ name: "AES-GCM", iv },
				sessionKey,
				chunkBuffer,
			);

			await waitForPeerBufferedAmountLow(peerId);

			sendControl(peerId, {
				kind: "file-transfer-chunk",
				transferId,
				chunkIndex,
				ivBase64: arrayBufferToBase64(iv.buffer),
			});

			if (!sendToPeer(peerId, ciphertext)) {
				throw new Error("Connection was lost while sending the file.");
			}

			useFileTransfersStore.getState().updateProgress(transferId, end);
		}

		sendControl(peerId, { kind: "file-transfer-complete", transferId });

		const blobId = crypto.randomUUID();
		await saveAttachmentBlob(blobId, file);

		const message: Message = {
			id: crypto.randomUUID(),
			senderId: selfId,
			isOwn: true,
			content: null,
			attachment: {
				type: inferAttachmentType(mimeType),
				name: file.name,
				mimeType,
				sizeLabel: formatFileSize(file.size),
				storage: "blob",
				blobId,
			},
			createdAt: new Date().toISOString(),
			status: "sent",
		};
		useMessagesStore.getState().appendMessage(peerId, message);
	} finally {
		useFileTransfersStore.getState().removeTransfer(transferId);
	}
}
