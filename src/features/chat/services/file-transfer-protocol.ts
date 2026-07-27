import type { MessageAttachmentType } from "@/features/chat/types/message";

/**
 * Control messages for large-file (>SMALL_ATTACHMENT_MAX_BYTES) chunked
 * transfer. Sent as JSON strings over the same DataChannel as regular chat
 * envelopes; each "chunk" control message is immediately followed by one
 * binary DataChannel message carrying that chunk's encrypted bytes. P2P
 * only — never queued through the relay.
 */
export type FileTransferControlMessage =
	| {
			kind: "file-transfer-start";
			transferId: string;
			name: string;
			mimeType: string;
			totalSize: number;
			totalChunks: number;
	  }
	| {
			kind: "file-transfer-chunk";
			transferId: string;
			chunkIndex: number;
			ivBase64: string;
	  }
	| { kind: "file-transfer-complete"; transferId: string }
	| { kind: "file-transfer-cancel"; transferId: string };

export const CHUNK_SIZE_BYTES = 64 * 1024;

export const SMALL_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const LARGE_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function isFileTransferControlMessage(
	value: unknown,
): value is FileTransferControlMessage {
	return (
		typeof value === "object" &&
		value !== null &&
		"kind" in value &&
		typeof (value as { kind: unknown }).kind === "string" &&
		(value as { kind: string }).kind.startsWith("file-transfer-")
	);
}

export function inferAttachmentType(mimeType: string): MessageAttachmentType {
	if (mimeType.startsWith("image/")) {
		return "image";
	}
	if (mimeType.startsWith("video/")) {
		return "video";
	}
	if (mimeType.startsWith("audio/")) {
		return "audio";
	}
	return "file";
}
