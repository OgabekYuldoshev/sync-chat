import type { Server as HttpServer } from "node:http";
import { parseCookie } from "cookie";
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
import { haversineMeters } from "./geo";
import { relayStore } from "./relay-store";

type GeoPoint = { lat: number; lng: number };

type Connection = {
	ws: WebSocket;
	deviceId: string;
	displayName: string;
	publicKey: string | null;
	location: GeoPoint | null;
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

	function distanceFrom(viewer: Connection, other: Connection): number | null {
		if (!(viewer.location && other.location)) {
			return null;
		}
		return Math.round(haversineMeters(viewer.location, other.location));
	}

	// Distance is computed per-viewer and sent instead of raw coordinates —
	// peers learn "how far", never each other's actual lat/lng.
	function broadcastPresence(): void {
		const known = [...connections.values()].filter(
			(connection) => connection.publicKey,
		);

		for (const viewer of connections.values()) {
			const peers: PresencePeer[] = known
				.filter((connection) => connection.deviceId !== viewer.deviceId)
				.map((connection) => ({
					deviceId: connection.deviceId,
					publicKey: connection.publicKey as string,
					displayName: connection.displayName,
					distanceMeters: distanceFrom(viewer, connection),
				}));

			send(viewer.ws, { type: "presence", peers });
		}
	}

	httpServer.on("upgrade", (request, socket, head) => {
		if (!isSignalingUpgrade(request.url)) {
			return;
		}

		const cookies = parseCookie(request.headers.cookie ?? "");
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
				location: null,
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
					case "location": {
						connection.location = { lat: message.lat, lng: message.lng };
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
