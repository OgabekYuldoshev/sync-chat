import {
	type ClientToServerMessage,
	type ServerToClientMessage,
	SIGNALING_PATH,
} from "@/shared/lib/ws/signaling-protocol";

export type SignalingStatus = "idle" | "connecting" | "open" | "closed";

type MessageHandler<T extends ServerToClientMessage["type"]> = (
	message: Extract<ServerToClientMessage, { type: T }>,
) => void;

const MAX_RECONNECT_DELAY_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 500;

function getSignalingUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${SIGNALING_PATH}`;
}

class SignalingClient {
	private socket: WebSocket | null = null;
	private manuallyClosed = false;
	private reconnectAttempt = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingOutbox: ClientToServerMessage[] = [];

	private readonly messageHandlers = new Map<
		ServerToClientMessage["type"],
		Set<(message: ServerToClientMessage) => void>
	>();
	private readonly statusHandlers = new Set<
		(status: SignalingStatus) => void
	>();

	connect(): void {
		if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
			return;
		}

		this.manuallyClosed = false;
		this.open();
	}

	disconnect(): void {
		this.manuallyClosed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.socket?.close();
	}

	send(message: ClientToServerMessage): void {
		if (this.socket?.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(message));
			return;
		}
		this.pendingOutbox.push(message);
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

	private open(): void {
		this.emitStatus("connecting");
		const socket = new WebSocket(getSignalingUrl());
		this.socket = socket;

		socket.addEventListener("open", () => {
			this.reconnectAttempt = 0;
			this.emitStatus("open");
			for (const message of this.pendingOutbox) {
				socket.send(JSON.stringify(message));
			}
			this.pendingOutbox = [];
		});

		socket.addEventListener("message", (event) => {
			this.handleRawMessage(event.data);
		});

		socket.addEventListener("close", () => {
			this.emitStatus("closed");
			if (!this.manuallyClosed) {
				this.scheduleReconnect();
			}
		});

		socket.addEventListener("error", () => {
			socket.close();
		});
	}

	private scheduleReconnect(): void {
		const delay = Math.min(
			BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt,
			MAX_RECONNECT_DELAY_MS,
		);
		this.reconnectAttempt += 1;
		this.reconnectTimer = setTimeout(() => {
			if (!this.manuallyClosed) {
				this.open();
			}
		}, delay);
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
