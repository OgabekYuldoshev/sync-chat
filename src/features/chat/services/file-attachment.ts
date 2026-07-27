import {
	inferAttachmentType,
	SMALL_ATTACHMENT_MAX_BYTES,
} from "@/features/chat/services/file-transfer-protocol";
import type { MessageAttachment } from "@/features/chat/types/message";
import { formatDuration } from "@/shared/utils/format-duration";
import { formatFileSize } from "@/shared/utils/format-file-size";

function readBlobAsDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

function assertWithinInlineSizeLimit(size: number): void {
	if (size > SMALL_ATTACHMENT_MAX_BYTES) {
		throw new Error(
			`File is too large for instant sharing. Max size is ${formatFileSize(SMALL_ATTACHMENT_MAX_BYTES)} — larger files are sent as a direct transfer instead.`,
		);
	}
}

export async function fileToAttachment(file: File): Promise<MessageAttachment> {
	assertWithinInlineSizeLimit(file.size);
	const dataUrl = await readBlobAsDataUrl(file);

	return {
		type: inferAttachmentType(file.type),
		name: file.name,
		mimeType: file.type || "application/octet-stream",
		sizeLabel: formatFileSize(file.size),
		storage: "inline",
		dataUrl,
	};
}

export async function audioBlobToAttachment(
	blob: Blob,
	durationSeconds: number,
): Promise<MessageAttachment> {
	assertWithinInlineSizeLimit(blob.size);
	const dataUrl = await readBlobAsDataUrl(blob);

	return {
		type: "audio",
		name: "Voice message",
		mimeType: blob.type || "audio/webm",
		sizeLabel: formatFileSize(blob.size),
		durationLabel: formatDuration(durationSeconds),
		storage: "inline",
		dataUrl,
	};
}
