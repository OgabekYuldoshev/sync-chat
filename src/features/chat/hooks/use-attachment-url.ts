"use client";

import { useEffect, useState } from "react";
import { getAttachmentBlob } from "@/features/chat/services/attachment-blob-db";
import type { MessageAttachment } from "@/features/chat/types/message";

/** Resolves a displayable URL for either storage variant: the inline base64 dataUrl directly, or an object URL for a large attachment's Blob (loaded from IndexedDB, revoked on unmount). */
export function useAttachmentUrl(attachment: MessageAttachment): string | null {
	const [url, setUrl] = useState<string | null>(
		attachment.storage === "inline" ? attachment.dataUrl : null,
	);

	useEffect(() => {
		if (attachment.storage === "inline") {
			setUrl(attachment.dataUrl);
			return;
		}

		let objectUrl: string | null = null;
		let cancelled = false;

		getAttachmentBlob(attachment.blobId).then((blob) => {
			if (cancelled || !blob) {
				return;
			}
			objectUrl = URL.createObjectURL(blob);
			setUrl(objectUrl);
		});

		return () => {
			cancelled = true;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [attachment]);

	return url;
}
