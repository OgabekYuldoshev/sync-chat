import type { PushSubscriptionPayload } from "@/shared/lib/ws/signaling-protocol";
import { redis } from "./redis-client";

const SUBSCRIPTION_TTL_SECONDS = 60 * 24 * 60 * 60;

function subscriptionKey(deviceId: string): string {
	return `push:sub:${deviceId}`;
}

/**
 * Redis-backed store for one Web Push subscription per device. Subscriptions
 * expire on their own after SUBSCRIPTION_TTL_SECONDS so devices that never
 * reconnect to refresh theirs don't linger forever.
 */
class PushSubscriptionStore {
	async save(
		deviceId: string,
		subscription: PushSubscriptionPayload,
	): Promise<void> {
		await redis.set(
			subscriptionKey(deviceId),
			JSON.stringify(subscription),
			"EX",
			SUBSCRIPTION_TTL_SECONDS,
		);
	}

	async get(deviceId: string): Promise<PushSubscriptionPayload | null> {
		const raw = await redis.get(subscriptionKey(deviceId));
		return raw ? (JSON.parse(raw) as PushSubscriptionPayload) : null;
	}

	async remove(deviceId: string): Promise<void> {
		await redis.del(subscriptionKey(deviceId));
	}
}

export const pushSubscriptionStore = new PushSubscriptionStore();
