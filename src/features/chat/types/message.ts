export type MessageStatus = "sent" | "delivered" | "read";

export type MessageAttachmentType = "image" | "video" | "audio" | "file";

export type MessageAttachment = {
	type: MessageAttachmentType;
	name: string;
	mimeType: string;
	dataUrl: string;
	sizeLabel: string;
	durationLabel?: string;
};

export type Message = {
	id: string;
	senderId: string;
	isOwn: boolean;
	content: string | null;
	attachment: MessageAttachment | null;
	createdAt: string;
	status: MessageStatus;
};
