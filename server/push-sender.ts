import webpush from "web-push";
import { pushSubscriptionStore } from "./push-subscription-store";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

const configured = Boolean(publicKey && privateKey && subject);

if (configured) {
	webpush.setVapidDetails(
		subject as string,
		publicKey as string,
		privateKey as string,
	);
} else {
	console.warn(
		"[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT not set — background notifications disabled.",
	);
}

/**
 * Wakes a device with a "new message" push when it's offline. The payload
 * never carries plaintext — the server has no decryption keys, so there's
 * nothing to send but a nudge; the client drains the real (encrypted)
 * message from the relay queue once it reconnects.
 */
export async function notifyNewMessage(deviceId: string): Promise<void> {
	if (!configured) {
		return;
	}

	const subscription = await pushSubscriptionStore.get(deviceId);
	if (!subscription) {
		return;
	}

	try {
		await webpush.sendNotification(
			subscription,
			JSON.stringify({ type: "new-message" }),
		);
	} catch (error) {
		const statusCode = (error as { statusCode?: number }).statusCode;

		if (statusCode === 404 || statusCode === 410) {
			// Subscription expired or was revoked by the browser — drop it so we
			// stop paying for failed sends until the device re-subscribes.
			await pushSubscriptionStore.remove(deviceId);
			return;
		}

		console.error("[push] failed to send notification:", error);
	}
}
