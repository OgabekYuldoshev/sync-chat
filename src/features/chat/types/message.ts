export type MessageStatus = "sent" | "delivered" | "read";

export type MessageAttachmentType = "image" | "video" | "audio" | "file";

type MessageAttachmentBase = {
	type: MessageAttachmentType;
	name: string;
	mimeType: string;
	sizeLabel: string;
	durationLabel?: string;
};

export type MessageAttachment = MessageAttachmentBase &
	(
		| { storage: "inline"; dataUrl: string }
		| { storage: "blob"; blobId: string }
	);

export type Message = {
	id: string;
	senderId: string;
	isOwn: boolean;
	content: string | null;
	attachment: MessageAttachment | null;
	createdAt: string;
	status: MessageStatus;
};
