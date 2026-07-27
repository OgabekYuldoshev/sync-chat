import type {
	MessageAttachment,
	MessageAttachmentType,
} from "@/features/chat/types/message";
import { formatDuration } from "@/shared/utils/format-duration";
import { formatFileSize } from "@/shared/utils/format-file-size";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function inferAttachmentType(mimeType: string): MessageAttachmentType {
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

function readBlobAsDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

function assertWithinSizeLimit(size: number): void {
	if (size > MAX_ATTACHMENT_BYTES) {
		throw new Error(
			`File is too large. Max size is ${formatFileSize(MAX_ATTACHMENT_BYTES)}.`,
		);
	}
}

export async function fileToAttachment(file: File): Promise<MessageAttachment> {
	assertWithinSizeLimit(file.size);
	const dataUrl = await readBlobAsDataUrl(file);

	return {
		type: inferAttachmentType(file.type),
		name: file.name,
		mimeType: file.type || "application/octet-stream",
		dataUrl,
		sizeLabel: formatFileSize(file.size),
	};
}

export async function audioBlobToAttachment(
	blob: Blob,
	durationSeconds: number,
): Promise<MessageAttachment> {
	assertWithinSizeLimit(blob.size);
	const dataUrl = await readBlobAsDataUrl(blob);

	return {
		type: "audio",
		name: "Voice message",
		mimeType: blob.type || "audio/webm",
		dataUrl,
		sizeLabel: formatFileSize(blob.size),
		durationLabel: formatDuration(durationSeconds),
	};
}
