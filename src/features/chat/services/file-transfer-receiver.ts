import { saveAttachmentBlob } from "@/features/chat/services/attachment-blob-db";
import {
	type FileTransferControlMessage,
	inferAttachmentType,
	isFileTransferControlMessage,
} from "@/features/chat/services/file-transfer-protocol";
import { useFileTransfersStore } from "@/features/chat/store/file-transfers-store";
import { useMessagesStore } from "@/features/chat/store/messages-store";
import type { Message } from "@/features/chat/types/message";
import { base64ToArrayBuffer } from "@/shared/lib/crypto/encoding";
import { importPeerPublicKey } from "@/shared/lib/crypto/keypair";
import { getSessionKey } from "@/shared/lib/crypto/session-key";
import {
	useContactsStore,
	waitForContactsHydration,
} from "@/shared/store/contacts-store";
import { onPeerData } from "@/shared/store/peer-store";
import { formatFileSize } from "@/shared/utils/format-file-size";

type IncomingTransfer = {
	peerId: string;
	name: string;
	mimeType: string;
	totalSize: number;
	sessionKey: CryptoKey;
	chunks: ArrayBuffer[];
	receivedBytes: number;
};

type PendingChunkMeta = {
	transferId: string;
	chunkIndex: number;
	iv: Uint8Array<ArrayBuffer>;
};

const incomingTransfers = new Map<string, IncomingTransfer>();
const pendingChunkByPeer = new Map<string, PendingChunkMeta>();

async function handleTransferStart(
	peerId: string,
	message: Extract<FileTransferControlMessage, { kind: "file-transfer-start" }>,
): Promise<void> {
	await waitForContactsHydration();
	const contact = useContactsStore.getState().contacts[peerId];
	if (!contact) {
		return;
	}

	const publicKey = await importPeerPublicKey(contact.publicKeyBase64);
	const sessionKey = await getSessionKey(peerId, publicKey);

	incomingTransfers.set(message.transferId, {
		peerId,
		name: message.name,
		mimeType: message.mimeType,
		totalSize: message.totalSize,
		sessionKey,
		chunks: [],
		receivedBytes: 0,
	});

	useFileTransfersStore.getState().startTransfer({
		transferId: message.transferId,
		peerId,
		direction: "receive",
		name: message.name,
		totalBytes: message.totalSize,
		transferredBytes: 0,
	});
}

async function handleTransferComplete(transferId: string): Promise<void> {
	const transfer = incomingTransfers.get(transferId);
	if (!transfer) {
		return;
	}

	const blob = new Blob(transfer.chunks, { type: transfer.mimeType });
	const blobId = crypto.randomUUID();
	await saveAttachmentBlob(blobId, blob);

	const message: Message = {
		id: crypto.randomUUID(),
		senderId: transfer.peerId,
		isOwn: false,
		content: null,
		attachment: {
			type: inferAttachmentType(transfer.mimeType),
			name: transfer.name,
			mimeType: transfer.mimeType,
			sizeLabel: formatFileSize(transfer.totalSize),
			storage: "blob",
			blobId,
		},
		createdAt: new Date().toISOString(),
		status: "delivered",
	};
	useMessagesStore.getState().appendMessage(transfer.peerId, message);

	incomingTransfers.delete(transferId);
	useFileTransfersStore.getState().removeTransfer(transferId);
}

function handleTransferCancel(transferId: string): void {
	incomingTransfers.delete(transferId);
	useFileTransfersStore.getState().removeTransfer(transferId);
}

async function handleControlMessage(
	peerId: string,
	message: FileTransferControlMessage,
): Promise<void> {
	switch (message.kind) {
		case "file-transfer-start": {
			await handleTransferStart(peerId, message);
			break;
		}
		case "file-transfer-chunk": {
			pendingChunkByPeer.set(peerId, {
				transferId: message.transferId,
				chunkIndex: message.chunkIndex,
				iv: new Uint8Array(base64ToArrayBuffer(message.ivBase64)),
			});
			break;
		}
		case "file-transfer-complete": {
			await handleTransferComplete(message.transferId);
			break;
		}
		case "file-transfer-cancel": {
			handleTransferCancel(message.transferId);
			break;
		}
		default: {
			break;
		}
	}
}

async function handleBinaryChunk(
	peerId: string,
	data: ArrayBuffer,
): Promise<void> {
	const pending = pendingChunkByPeer.get(peerId);
	if (!pending) {
		return;
	}
	pendingChunkByPeer.delete(peerId);

	const transfer = incomingTransfers.get(pending.transferId);
	if (!transfer) {
		return;
	}

	const plaintext = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: pending.iv },
		transfer.sessionKey,
		data,
	);

	transfer.chunks[pending.chunkIndex] = plaintext;
	transfer.receivedBytes += plaintext.byteLength;
	useFileTransfersStore
		.getState()
		.updateProgress(pending.transferId, transfer.receivedBytes);
}

onPeerData((peerId, data) => {
	if (typeof data === "string") {
		let parsed: unknown;
		try {
			parsed = JSON.parse(data);
		} catch {
			return;
		}

		if (isFileTransferControlMessage(parsed)) {
			handleControlMessage(peerId, parsed).catch((error) => {
				console.error("Failed to handle file-transfer control message", error);
			});
		}
		return;
	}

	handleBinaryChunk(peerId, data).catch((error) => {
		console.error("Failed to decrypt incoming file chunk", error);
	});
});
