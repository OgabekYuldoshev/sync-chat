"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useFileTransfersStore } from "@/features/chat/store/file-transfers-store";
import { formatFileSize } from "@/shared/utils/format-file-size";

type TransferProgressBannerProps = {
	peerId: string;
};

export function TransferProgressBanner({
	peerId,
}: TransferProgressBannerProps) {
	const transfers = useFileTransfersStore((state) => state.transfers);
	const activeTransfers = Object.values(transfers).filter(
		(transfer) => transfer.peerId === peerId,
	);

	if (activeTransfers.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2 border-border border-t px-4 py-2.5">
			{activeTransfers.map((transfer) => {
				const percent =
					transfer.totalBytes > 0
						? Math.round(
								(transfer.transferredBytes / transfer.totalBytes) * 100,
							)
						: 0;
				const Icon = transfer.direction === "send" ? ArrowUp : ArrowDown;

				return (
					<div key={transfer.transferId} className="flex items-center gap-3">
						<Icon className="size-4 shrink-0 text-primary" />
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-2 text-xs">
								<span className="truncate font-medium">{transfer.name}</span>
								<span className="shrink-0 text-muted-foreground">
									{formatFileSize(transfer.transferredBytes)} /{" "}
									{formatFileSize(transfer.totalBytes)}
								</span>
							</div>
							<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface">
								<div
									className="h-full rounded-full bg-primary transition-all"
									style={{ width: `${percent}%` }}
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
