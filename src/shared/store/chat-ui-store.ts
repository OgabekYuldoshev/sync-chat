import { create } from "zustand";

type ChatUiStore = {
	activeChatId: string | null;
	setActiveChatId: (chatId: string | null) => void;
};

export const useChatUiStore = create<ChatUiStore>((set) => ({
	activeChatId: null,
	setActiveChatId: (chatId) => set({ activeChatId: chatId }),
}));
