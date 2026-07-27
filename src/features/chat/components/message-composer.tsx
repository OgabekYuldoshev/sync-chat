"use client";

import { Mic, Paperclip, SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { EmojiPickerButton } from "@/features/chat/components/emoji-picker-button";
import { RecordingBar } from "@/features/chat/components/recording-bar";
import { LARGE_ATTACHMENT_MAX_BYTES } from "@/features/chat/services/file-transfer-protocol";
import { Button } from "@/shared/components/ui/button";
import { formatFileSize } from "@/shared/utils/format-file-size";

type MessageComposerProps = {
	onSend?: (content: string) => void;
	onSendFile?: (file: File) => void;
	onSendAudio?: (blob: Blob, durationSeconds: number) => void;
};

export function MessageComposer({
	onSend,
	onSendFile,
	onSendAudio,
}: MessageComposerProps) {
	const [draft, setDraft] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function handleSend() {
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		onSend?.(trimmed);
		setDraft("");
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleEmojiSelect(emoji: string) {
		const textarea = textareaRef.current;
		if (!textarea) {
			setDraft((previous) => previous + emoji);
			return;
		}

		const start = textarea.selectionStart ?? draft.length;
		const end = textarea.selectionEnd ?? draft.length;
		const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
		setDraft(next);

		requestAnimationFrame(() => {
			textarea.focus();
			const cursor = start + emoji.length;
			textarea.setSelectionRange(cursor, cursor);
		});
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) {
			return;
		}

		if (file.size > LARGE_ATTACHMENT_MAX_BYTES) {
			toast.error(
				`File is too large. Max size is ${formatFileSize(LARGE_ATTACHMENT_MAX_BYTES)}.`,
			);
			return;
		}

		onSendFile?.(file);
	}

	function handleAudioSend(blob: Blob, durationSeconds: number) {
		setIsRecording(false);
		onSendAudio?.(blob, durationSeconds);
	}

	const canSend = draft.trim().length > 0;

	if (isRecording) {
		return (
			<div className="shrink-0 border-border border-t px-3 py-3 pb-safe">
				<div className="rounded-2xl bg-surface">
					<RecordingBar
						onCancel={() => setIsRecording(false)}
						onSend={handleAudioSend}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="shrink-0 border-border border-t px-3 pt-3 pb-safe">
			<div className="flex items-end gap-2 rounded-2xl bg-surface p-2">
				<EmojiPickerButton onSelect={handleEmojiSelect} />

				<Button
					variant="ghost"
					size="icon-lg"
					aria-label="Attach file"
					className="shrink-0"
					onClick={() => fileInputRef.current?.click()}
				>
					<Paperclip className="size-5" />
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={handleFileChange}
				/>

				<TextareaAutosize
					ref={textareaRef}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Write a message..."
					minRows={1}
					maxRows={6}
					className="flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
				/>

				{canSend ? (
					<Button
						size="icon-lg"
						aria-label="Send message"
						className="shrink-0"
						onClick={handleSend}
					>
						<SendHorizontal className="size-5" />
					</Button>
				) : (
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label="Record voice message"
						className="shrink-0"
						onClick={() => setIsRecording(true)}
					>
						<Mic className="size-5" />
					</Button>
				)}
			</div>
		</div>
	);
}
