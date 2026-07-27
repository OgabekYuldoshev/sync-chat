import { create } from "zustand";

export type FileTransferDirection = "send" | "receive";

export type FileTransferProgress = {
	transferId: string;
	peerId: string;
	direction: FileTransferDirection;
	name: string;
	totalBytes: number;
	transferredBytes: number;
};

type FileTransfersStore = {
	transfers: Record<string, FileTransferProgress>;
	startTransfer: (transfer: FileTransferProgress) => void;
	updateProgress: (transferId: string, transferredBytes: number) => void;
	removeTransfer: (transferId: string) => void;
};

export const useFileTransfersStore = create<FileTransfersStore>((set) => ({
	transfers: {},

	startTransfer: (transfer) =>
		set((state) => ({
			transfers: { ...state.transfers, [transfer.transferId]: transfer },
		})),

	updateProgress: (transferId, transferredBytes) =>
		set((state) => {
			const existing = state.transfers[transferId];
			if (!existing) {
				return state;
			}
			return {
				transfers: {
					...state.transfers,
					[transferId]: { ...existing, transferredBytes },
				},
			};
		}),

	removeTransfer: (transferId) =>
		set((state) => {
			const next = { ...state.transfers };
			delete next[transferId];
			return { transfers: next };
		}),
}));
