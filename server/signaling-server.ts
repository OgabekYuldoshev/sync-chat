import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import {
	DEVICE_ID_COOKIE,
	DISPLAY_NAME_COOKIE,
} from "@/shared/constants/cookies";
import type {
	ClientToServerMessage,
	PresencePeer,
	ServerToClientMessage,
} from "@/shared/lib/ws/signaling-protocol";
import { SIGNALING_PATH } from "@/shared/lib/ws/signaling-protocol";
import { generateGuestName } from "@/shared/utils/generate-guest-name";
import { parseCookieHeader } from "./parse-cookie";
import { relayStore } from "./relay-store";

type Connection = {
	ws: WebSocket;
	deviceId: string;
	displayName: string;
	publicKey: string | null;
};

/**
 * Attaches the P2P signaling WebSocket server to an existing HTTP server on
 * SIGNALING_PATH. Call `isSignalingUpgrade` from the http server's "upgrade"
 * listener first so unrelated upgrades (e.g. Next's HMR socket) fall through
 * to Next's own upgrade handler untouched.
 */
export function isSignalingUpgrade(url: string | undefined): boolean {
	if (!url) {
		return false;
	}
	return new URL(url, "http://localhost").pathname === SIGNALING_PATH;
}

export function attachSignalingServer(httpServer: HttpServer): void {
	const wss = new WebSocketServer({ noServer: true });
	const connections = new Map<string, Connection>();

	function send(ws: WebSocket, message: ServerToClientMessage): void {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}

	function broadcastPresence(): void {
		const allPeers: PresencePeer[] = [...connections.values()]
			.filter((connection) => connection.publicKey)
			.map((connection) => ({
				deviceId: connection.deviceId,
				publicKey: connection.publicKey as string,
				displayName: connection.displayName,
			}));

		for (const connection of connections.values()) {
			send(connection.ws, {
				type: "presence",
				peers: allPeers.filter((peer) => peer.deviceId !== connection.deviceId),
			});
		}
	}

	httpServer.on("upgrade", (request, socket, head) => {
		if (!isSignalingUpgrade(request.url)) {
			return;
		}

		const cookies = parseCookieHeader(request.headers.cookie);
		const deviceId = cookies[DEVICE_ID_COOKIE];

		if (!deviceId) {
			socket.destroy();
			return;
		}

		const displayName =
			cookies[DISPLAY_NAME_COOKIE] || generateGuestName(deviceId);

		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, deviceId, displayName);
		});
	});

	wss.on(
		"connection",
		(ws: WebSocket, deviceId: string, displayName: string) => {
			connections.get(deviceId)?.ws.close();

			const connection: Connection = {
				ws,
				deviceId,
				displayName,
				publicKey: null,
			};
			connections.set(deviceId, connection);

			send(ws, { type: "welcome", deviceId });

			for (const queued of relayStore.drain(deviceId)) {
				send(ws, {
					type: "relay-message",
					from: queued.from,
					messageId: queued.messageId,
					envelope: queued.envelope,
				});
			}

			ws.on("message", (raw) => {
				let message: ClientToServerMessage;

				try {
					message = JSON.parse(raw.toString());
				} catch {
					return;
				}

				switch (message.type) {
					case "hello": {
						connection.publicKey = message.publicKey;
						broadcastPresence();
						break;
					}
					case "signal": {
						const target = connections.get(message.to);
						if (target) {
							send(target.ws, {
								type: "signal",
								from: deviceId,
								signal: message.signal,
							});
						}
						break;
					}
					case "relay-message": {
						const messageId = crypto.randomUUID();
						const target = connections.get(message.to);

						if (target) {
							send(target.ws, {
								type: "relay-message",
								from: deviceId,
								messageId,
								envelope: message.envelope,
							});
						} else {
							relayStore.enqueue(message.to, {
								messageId,
								from: deviceId,
								envelope: message.envelope,
							});
						}
						break;
					}
					case "relay-ack": {
						relayStore.ack(deviceId, message.messageId);
						break;
					}
					default: {
						break;
					}
				}
			});

			ws.on("close", () => {
				if (connections.get(deviceId) === connection) {
					connections.delete(deviceId);
					broadcastPresence();
				}
			});
		},
	);
}
