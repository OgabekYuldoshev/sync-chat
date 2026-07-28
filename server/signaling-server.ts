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
import { haversineMeters } from "@/shared/utils/haversine-distance";
import { notifyNewMessage } from "./push-sender";
import { pushSubscriptionStore } from "./push-subscription-store";
import { relayStore } from "./relay-store";

type GeoPoint = { lat: number; lng: number };

type Connection = {
	ws: WebSocket;
	deviceId: string;
	displayName: string;
	publicKey: string | null;
	location: GeoPoint | null;
	isAlive: boolean;
};

const HEARTBEAT_INTERVAL_MS = 30_000;

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

/** Closes every open signaling connection and stops accepting new ones. */
export type SignalingServerCloser = () => void;

export function attachSignalingServer(
	httpServer: HttpServer,
): SignalingServerCloser {
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
		async (ws: WebSocket, deviceId: string, displayName: string) => {
			connections.get(deviceId)?.ws.close();

			const connection: Connection = {
				ws,
				deviceId,
				displayName,
				publicKey: null,
				location: null,
				isAlive: true,
			};
			connections.set(deviceId, connection);

			ws.on("pong", () => {
				connection.isAlive = true;
			});

			send(ws, { type: "welcome", deviceId });

			try {
				for (const queued of await relayStore.drain(deviceId)) {
					send(ws, {
						type: "relay-message",
						from: queued.from,
						messageId: queued.messageId,
						envelope: queued.envelope,
					});
				}
			} catch (error) {
				console.error("[signaling] failed to drain relay queue:", error);
			}

			ws.on("message", async (raw) => {
				let message: ClientToServerMessage;

				try {
					message = JSON.parse(raw.toString());
				} catch {
					return;
				}

				try {
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
								await relayStore.enqueue(message.to, {
									messageId,
									from: deviceId,
									envelope: message.envelope,
								});
								await notifyNewMessage(message.to);
							}
							break;
						}
						case "relay-ack": {
							await relayStore.ack(deviceId, message.messageId);
							break;
						}
						case "push-subscribe": {
							await pushSubscriptionStore.save(deviceId, message.subscription);
							break;
						}
						case "push-unsubscribe": {
							await pushSubscriptionStore.remove(deviceId);
							break;
						}
						default: {
							break;
						}
					}
				} catch (error) {
					console.error("[signaling] failed to handle message:", error);
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

	// Cloudflare/Traefik drop idle sockets without ever sending a close
	// frame, leaving both sides believing the connection is still open.
	// Pinging on an interval and terminating non-responders forces a real
	// "close" event so clients' ReconnectingWebSocket actually reconnects.
	const heartbeat = setInterval(() => {
		for (const connection of connections.values()) {
			if (!connection.isAlive) {
				connection.ws.terminate();
				continue;
			}
			connection.isAlive = false;
			connection.ws.ping();
		}
	}, HEARTBEAT_INTERVAL_MS);

	return () => {
		clearInterval(heartbeat);
		for (const connection of connections.values()) {
			connection.ws.close(1001, "Server shutting down");
		}
		wss.close();
	};
}
