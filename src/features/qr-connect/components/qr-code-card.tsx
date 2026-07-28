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
		<Card className="w-full items-center gap-4 p-6 text-center">
			<div className="space-y-1">
				<p className="font-heading font-medium text-sm">Your QR code</p>
				<p className="text-muted-foreground text-xs">
					Scan to connect instantly
				</p>
			</div>

			<div className="rounded-xl bg-white p-3">
				<QRCode
					value={inviteLink}
					size={144}
					fgColor="#0a0a0a"
					bgColor="#ffffff"
				/>
			</div>

			<p className="w-full truncate rounded-lg bg-muted px-3 py-1.5 font-mono text-muted-foreground text-xs">
				{inviteLink}
			</p>

			<Button
				onClick={handleCopy}
				variant="outline"
				size="sm"
				className="w-full"
			>
				{copied ? (
					<Check className="size-3.5" />
				) : (
					<Copy className="size-3.5" />
				)}
				{copied ? "Copied" : "Copy invite link"}
			</Button>
		</Card>
	);
}
