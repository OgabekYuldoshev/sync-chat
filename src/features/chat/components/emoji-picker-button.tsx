"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";

type EmojiPickerButtonProps = {
	onSelect: (emoji: string) => void;
};

export function EmojiPickerButton({ onSelect }: EmojiPickerButtonProps) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label="Add emoji"
						className="shrink-0"
					/>
				}
			>
				<Smile className="size-5" />
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="start"
				className="w-auto border-none bg-transparent p-0 shadow-none ring-0"
			>
				<EmojiPicker
					theme={Theme.DARK}
					onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
					width={320}
					height={360}
					previewConfig={{ showPreview: false }}
				/>
			</PopoverContent>
		</Popover>
	);
}
