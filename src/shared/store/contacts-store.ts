import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Contact = {
	deviceId: string;
	displayName: string;
	publicKeyBase64: string;
	addedAt: string;
};

type ContactsStore = {
	contacts: Record<string, Contact>;
	addContact: (contact: Contact) => void;
};

export const useContactsStore = create<ContactsStore>()(
	persist(
		(set) => ({
			contacts: {},
			addContact: (contact) =>
				set((state) => ({
					contacts: { ...state.contacts, [contact.deviceId]: contact },
				})),
		}),
		{
			name: "peerchat-contacts",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

/**
 * Resolves once contacts have been rehydrated from localStorage. Persisted
 * stores hydrate asynchronously after the module first loads, so anything
 * that reads contacts very early (e.g. a relay message arriving right after
 * reconnect) must await this first or it can race an still-empty store.
 */
export function waitForContactsHydration(): Promise<void> {
	if (useContactsStore.persist.hasHydrated()) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		const unsubscribe = useContactsStore.persist.onFinishHydration(() => {
			unsubscribe();
			resolve();
		});
	});
}
