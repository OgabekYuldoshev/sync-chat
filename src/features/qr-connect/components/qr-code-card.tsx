import { Share2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

// biome-ignore format: keep the pattern rows visually aligned
const QR_PATTERN = [
	1, 1, 1, 0, 1, 0,
	1, 0, 1, 0, 0, 1,
	1, 1, 1, 0, 1, 1,
	0, 0, 0, 1, 0, 0,
	1, 0, 1, 0, 1, 1,
	1, 1, 0, 1, 0, 1,
];

const QR_CELLS = QR_PATTERN.map((filled, index) => ({
	id: `qr-cell-${index}`,
	filled: filled === 1,
}));

type QrCodeCardProps = {
	inviteLink: string;
	onShare?: () => void;
};

export function QrCodeCard({ inviteLink, onShare }: QrCodeCardProps) {
	return (
		<Card className="flex flex-col items-center gap-5 p-8 text-center">
			<div className="space-y-1">
				<p className="font-semibold text-lg">Your QR Code</p>
				<p className="text-muted-foreground text-sm">
					Let others scan this to connect instantly
				</p>
			</div>

			<div
				aria-hidden
				className="grid size-48 grid-cols-6 grid-rows-6 gap-1.5 rounded-2xl bg-surface p-4"
			>
				{QR_CELLS.map((cell) => (
					<span
						key={cell.id}
						className={
							cell.filled
								? "rounded-[3px] bg-foreground"
								: "rounded-[3px] bg-transparent"
						}
					/>
				))}
			</div>

			<p className="max-w-[220px] truncate text-muted-foreground text-xs">
				{inviteLink}
			</p>

			<Button onClick={onShare} className="w-full">
				<Share2 className="size-4" />
				Share invite link
			</Button>
		</Card>
	);
}
