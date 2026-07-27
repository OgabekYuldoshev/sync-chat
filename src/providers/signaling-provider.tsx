"use client";

import { useEffect } from "react";
import { signalingClient } from "@/shared/lib/ws/signaling-client";

// Side-effect imports: each module wires cross-store subscriptions at module
// scope (public key announcement, WebRTC signal handling, message decrypt).
// Next.js code-splits per route, so without importing them here explicitly,
// a route that never happens to reference these stores directly would never
// load — and never run — this wiring. Importing them from the one provider
// mounted on every route guarantees they're always initialized.
import "@/shared/store/signaling-store";
import "@/shared/store/peer-store";
import "@/features/chat/store/messages-store";
import "@/features/chat/services/file-transfer-receiver";

type SignalingProviderProps = {
	children: React.ReactNode;
};

export function SignalingProvider({ children }: SignalingProviderProps) {
	useEffect(() => {
		signalingClient.connect();
		return () => signalingClient.disconnect();
	}, []);

	return children;
}
