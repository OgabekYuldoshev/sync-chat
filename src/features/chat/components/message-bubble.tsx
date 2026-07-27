import { Check, CheckCheck, FileText, Play } from "lucide-react";
import type { Message } from "@/features/chat/types/message";
import { cn } from "@/shared/lib/cn";
import { formatMessageTime } from "@/shared/utils/format-date";

type MessageBubbleProps = {
	message: Message;
};

function MessageStatusIcon({ status }: { status: Message["status"] }) {
	if (status === "read") {
		return <CheckCheck className="size-3.5 text-primary" />;
	}

	if (status === "delivered") {
		return <CheckCheck className="size-3.5 text-muted-foreground" />;
	}

	return <Check className="size-3.5 text-muted-foreground" />;
}

function MessageAttachmentContent({
	attachment,
	isOwn,
}: {
	attachment: NonNullable<Message["attachment"]>;
	isOwn: boolean;
}) {
	if (attachment.type === "image") {
		return (
			<div className="flex aspect-video w-64 items-center justify-center rounded-lg bg-black/20 text-muted-foreground text-xs">
				{attachment.name}
			</div>
		);
	}

	if (attachment.type === "video") {
		return (
			<div className="relative flex aspect-video w-64 items-center justify-center rounded-lg bg-black/30">
				<span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white">
					<Play className="size-5" />
				</span>
			</div>
		);
	}

	if (attachment.type === "audio") {
		return (
			<div className="flex w-56 items-center gap-3 rounded-lg bg-black/10 px-3 py-2.5">
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-full",
						isOwn ? "bg-primary-foreground/20" : "bg-primary/15 text-primary",
					)}
				>
					<Play className="size-4" />
				</span>
				<div className="h-1 flex-1 rounded-full bg-current/20" />
				<span className="text-xs opacity-70">{attachment.durationLabel}</span>
			</div>
		);
	}

	return (
		<div className="flex w-64 items-center gap-3 rounded-lg bg-black/10 px-3 py-2.5">
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-lg",
					isOwn ? "bg-primary-foreground/20" : "bg-primary/15 text-primary",
				)}
			>
				<FileText className="size-4" />
			</span>
			<div className="min-w-0">
				<p className="truncate font-medium text-sm">{attachment.name}</p>
				<p className="text-xs opacity-70">{attachment.sizeLabel}</p>
			</div>
		</div>
	);
}

export function MessageBubble({ message }: MessageBubbleProps) {
	return (
		<div
			className={cn(
				"flex w-full",
				message.isOwn ? "justify-end" : "justify-start",
			)}
		>
			<div
				className={cn(
					"max-w-[75%] space-y-1 rounded-2xl px-3.5 py-2.5",
					message.isOwn
						? "rounded-br-md bg-primary text-primary-foreground"
						: "rounded-bl-md bg-surface text-surface-foreground",
				)}
			>
				{message.attachment && (
					<MessageAttachmentContent
						attachment={message.attachment}
						isOwn={message.isOwn}
					/>
				)}

				{message.content && (
					<p className="text-sm leading-relaxed">{message.content}</p>
				)}

				<div className="flex items-center justify-end gap-1 opacity-70">
					<span className="text-[11px]">
						{formatMessageTime(message.createdAt)}
					</span>
					{message.isOwn && <MessageStatusIcon status={message.status} />}
				</div>
			</div>
		</div>
	);
}
