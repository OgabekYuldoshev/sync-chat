"use client";

import { Mic, Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

type MessageComposerProps = {
	onSend?: (content: string) => void;
};

export function MessageComposer({ onSend }: MessageComposerProps) {
	const [draft, setDraft] = useState("");

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

	const canSend = draft.trim().length > 0;

	return (
		<div className="shrink-0 border-border border-t px-3 pt-3 pb-safe">
			<div className="flex items-end gap-2 rounded-2xl bg-surface p-2">
				<Button
					variant="ghost"
					size="icon-lg"
					aria-label="Add emoji"
					className="shrink-0"
				>
					<Smile className="size-5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-lg"
					aria-label="Attach file"
					className="shrink-0"
				>
					<Paperclip className="size-5" />
				</Button>

				<Textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Write a message..."
					rows={1}
					className="max-h-32 min-h-9 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
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
					>
						<Mic className="size-5" />
					</Button>
				)}
			</div>
		</div>
	);
}
