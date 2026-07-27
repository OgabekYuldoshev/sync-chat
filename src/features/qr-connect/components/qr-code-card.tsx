"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

type QrCodeCardProps = {
	inviteLink: string;
};

export function QrCodeCard({ inviteLink }: QrCodeCardProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(inviteLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<Card className="flex flex-col items-center gap-5 p-8 text-center">
			<div className="space-y-1">
				<p className="font-semibold text-lg">Your QR Code</p>
				<p className="text-muted-foreground text-sm">
					Let others scan this to connect instantly
				</p>
			</div>

			<div className="rounded-2xl bg-white p-4">
				<QRCode
					value={inviteLink}
					size={176}
					fgColor="#0a0a0a"
					bgColor="#ffffff"
				/>
			</div>

			<p className="max-w-[220px] truncate text-muted-foreground text-xs">
				{inviteLink}
			</p>

			<Button onClick={handleCopy} className="w-full">
				{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
				{copied ? "Copied!" : "Copy invite link"}
			</Button>
		</Card>
	);
}
