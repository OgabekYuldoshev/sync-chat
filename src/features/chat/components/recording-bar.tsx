"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { formatDuration } from "@/shared/utils/format-duration";

type RecordingBarProps = {
	onCancel: () => void;
	onSend: (blob: Blob, durationSeconds: number) => void;
};

export function RecordingBar({ onCancel, onSend }: RecordingBarProps) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const onCancelRef = useRef(onCancel);
	const onSendRef = useRef(onSend);

	useEffect(() => {
		onCancelRef.current = onCancel;
		onSendRef.current = onSend;
	});

	useEffect(() => {
		let isMounted = true;

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				if (!isMounted) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}

				streamRef.current = stream;
				const recorder = new MediaRecorder(stream);
				recorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunksRef.current.push(event.data);
					}
				};
				recorder.start();
				recorderRef.current = recorder;
			})
			.catch(() => {
				toast.error("Microphone access was denied.");
				onCancelRef.current();
			});

		const interval = setInterval(() => {
			setElapsedSeconds((seconds) => seconds + 1);
		}, 1000);

		return () => {
			isMounted = false;
			clearInterval(interval);
			if (recorderRef.current && recorderRef.current.state !== "inactive") {
				recorderRef.current.stop();
			}
			for (const track of streamRef.current?.getTracks() ?? []) {
				track.stop();
			}
		};
	}, []);

	function handleSend() {
		const recorder = recorderRef.current;
		if (!recorder || recorder.state === "inactive") {
			onCancelRef.current();
			return;
		}

		recorder.onstop = () => {
			const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
			onSendRef.current(blob, elapsedSeconds);
		};
		recorder.stop();
		for (const track of streamRef.current?.getTracks() ?? []) {
			track.stop();
		}
	}

	function handleCancel() {
		if (recorderRef.current && recorderRef.current.state !== "inactive") {
			recorderRef.current.stop();
		}
		for (const track of streamRef.current?.getTracks() ?? []) {
			track.stop();
		}
		onCancelRef.current();
	}

	return (
		<div className="flex items-center gap-3 px-2 py-1">
			<Button
				variant="ghost"
				size="icon-lg"
				aria-label="Cancel recording"
				onClick={handleCancel}
			>
				<X className="size-5" />
			</Button>

			<span className="flex items-center gap-2 text-muted-foreground text-sm tabular-nums">
				<span className="size-2.5 animate-pulse rounded-full bg-destructive" />
				{formatDuration(elapsedSeconds)}
			</span>

			<div className="flex-1" />

			<Button
				size="icon-lg"
				aria-label="Send voice message"
				onClick={handleSend}
			>
				<Check className="size-5" />
			</Button>
		</div>
	);
}
