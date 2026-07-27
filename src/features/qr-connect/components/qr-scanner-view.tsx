"use client";

import { CameraOff } from "lucide-react";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/shared/components/empty-state";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractDeviceId(scannedText: string): string | null {
	try {
		const url = new URL(scannedText);
		const segments = url.pathname.split("/").filter(Boolean);
		const last = segments.at(-1);
		return last && UUID_PATTERN.test(last) ? last : null;
	} catch {
		return UUID_PATTERN.test(scannedText) ? scannedText : null;
	}
}

type QrScannerViewProps = {
	onScanned: (deviceId: string) => void;
};

export function QrScannerView({ onScanned }: QrScannerViewProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!videoElement) {
			return;
		}

		const scanner = new QrScanner(
			videoElement,
			(result) => {
				const deviceId = extractDeviceId(result.data);
				if (deviceId) {
					scanner.stop();
					onScanned(deviceId);
				}
			},
			{ highlightScanRegion: true, highlightCodeOutline: true },
		);

		scanner.start().catch((startError) => {
			console.error("QrScanner start failed:", startError);
			setError("Camera access was denied or is unavailable.");
		});

		return () => {
			scanner.stop();
			scanner.destroy();
		};
	}, [onScanned]);

	if (error) {
		return (
			<EmptyState
				icon={CameraOff}
				title="Camera unavailable"
				description={error}
			/>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl bg-black">
			<video
				ref={videoRef}
				className="aspect-square w-full object-cover"
				muted
				playsInline
			/>
		</div>
	);
}
