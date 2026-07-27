import ReconnectingWebSocket from "reconnecting-websocket";
import {
	type ClientToServerMessage,
	type ServerToClientMessage,
	SIGNALING_PATH,
} from "@/shared/lib/ws/signaling-protocol";

export type SignalingStatus = "idle" | "connecting" | "open" | "closed";

type MessageHandler<T extends ServerToClientMessage["type"]> = (
	message: Extract<ServerToClientMessage, { type: T }>,
) => void;

const MAX_ENQUEUED_MESSAGES = 100;

function getSignalingUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${SIGNALING_PATH}`;
}

class SignalingClient {
	private socket: ReconnectingWebSocket | null = null;

	private readonly messageHandlers = new Map<
		ServerToClientMessage["type"],
		Set<(message: ServerToClientMessage) => void>
	>();
	private readonly statusHandlers = new Set<
		(status: SignalingStatus) => void
	>();

	connect(): void {
		if (this.socket) {
			return;
		}

		const socket = new ReconnectingWebSocket(getSignalingUrl, [], {
			maxEnqueuedMessages: MAX_ENQUEUED_MESSAGES,
		});
		this.socket = socket;
		this.emitStatus("connecting");

		socket.addEventListener("open", () => this.emitStatus("open"));
		socket.addEventListener("close", () => this.emitStatus("closed"));
		socket.addEventListener("message", (event) =>
			this.handleRawMessage(event.data),
		);
	}

	disconnect(): void {
		this.socket?.close();
		this.socket = null;
	}

	send(message: ClientToServerMessage): void {
		this.socket?.send(JSON.stringify(message));
	}

	on<T extends ServerToClientMessage["type"]>(
		type: T,
		handler: MessageHandler<T>,
	): () => void {
		const handlers =
			this.messageHandlers.get(type) ??
			new Set<(message: ServerToClientMessage) => void>();
		handlers.add(handler as (message: ServerToClientMessage) => void);
		this.messageHandlers.set(type, handlers);

		return () => {
			handlers.delete(handler as (message: ServerToClientMessage) => void);
		};
	}

	onStatusChange(handler: (status: SignalingStatus) => void): () => void {
		this.statusHandlers.add(handler);
		return () => {
			this.statusHandlers.delete(handler);
		};
	}

	private handleRawMessage(raw: unknown): void {
		if (typeof raw !== "string") {
			return;
		}

		let message: ServerToClientMessage;
		try {
			message = JSON.parse(raw);
		} catch {
			return;
		}

		const handlers = this.messageHandlers.get(message.type);
		if (!handlers) {
			return;
		}
		for (const handler of handlers) {
			handler(message);
		}
	}

	private emitStatus(status: SignalingStatus): void {
		for (const handler of this.statusHandlers) {
			handler(status);
		}
	}
}

export const signalingClient = new SignalingClient();
