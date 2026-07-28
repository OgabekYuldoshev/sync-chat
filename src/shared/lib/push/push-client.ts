import { signalingClient } from "@/shared/lib/ws/signaling-client";
import type { PushSubscriptionPayload } from "@/shared/lib/ws/signaling-protocol";

const SERVICE_WORKER_URL = "/sw.js";

export function isPushSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

export function getNotificationPermission(): NotificationPermission | null {
	return isPushSupported() ? Notification.permission : null;
}

// Web Push wants the VAPID key as a raw Uint8Array, but browsers only accept
// it base64url-encoded over the wire — this reverses that encoding.
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
	const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
	const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!isPushSupported()) {
		return Promise.resolve(null);
	}
	return navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
	if (!isPushSupported()) {
		return null;
	}
	const registration = await navigator.serviceWorker.ready;
	return registration.pushManager.getSubscription();
}

function toPayload(subscription: PushSubscription): PushSubscriptionPayload {
	const json = subscription.toJSON();
	if (!(json.endpoint && json.keys?.p256dh && json.keys?.auth)) {
		throw new Error("Push subscription is missing required fields.");
	}
	return {
		endpoint: json.endpoint,
		keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
	};
}

export async function enablePushNotifications(): Promise<boolean> {
	if (!isPushSupported()) {
		return false;
	}

	const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	if (!vapidPublicKey) {
		console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
		return false;
	}

	const permission = await Notification.requestPermission();
	if (permission !== "granted") {
		return false;
	}

	const registered = await registerServiceWorker();
	if (!registered) {
		return false;
	}
	const registration = await navigator.serviceWorker.ready;

	const existing = await registration.pushManager.getSubscription();
	const subscription =
		existing ??
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
		}));

	signalingClient.send({
		type: "push-subscribe",
		subscription: toPayload(subscription),
	});
	return true;
}

export async function disablePushNotifications(): Promise<void> {
	const subscription = await getExistingSubscription();
	if (subscription) {
		await subscription.unsubscribe();
	}
	signalingClient.send({ type: "push-unsubscribe" });
}
