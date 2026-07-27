import type { EncryptedEnvelope } from "@/shared/lib/ws/signaling-protocol";
import { redis } from "./redis-client";

export type QueuedMessage = {
	messageId: string;
	from: string;
	envelope: EncryptedEnvelope;
};

const MAX_QUEUED_PER_RECIPIENT = 200;
const QUEUE_TTL_SECONDS = 14 * 24 * 60 * 60;

function queueKey(recipientId: string): string {
	return `relay:queue:${recipientId}`;
}

/**
 * Redis-backed store-and-forward queue for messages sent while the
 * recipient is offline. Durable across server restarts; queues expire on
 * their own after QUEUE_TTL_SECONDS so abandoned devices don't linger
 * forever.
 */
class RelayStore {
	async enqueue(recipientId: string, message: QueuedMessage): Promise<void> {
		const key = queueKey(recipientId);
		await redis
			.multi()
			.rpush(key, JSON.stringify(message))
			.ltrim(key, -MAX_QUEUED_PER_RECIPIENT, -1)
			.expire(key, QUEUE_TTL_SECONDS)
			.exec();
	}

	async drain(recipientId: string): Promise<QueuedMessage[]> {
		const raw = await redis.lrange(queueKey(recipientId), 0, -1);
		return raw.map((entry) => JSON.parse(entry) as QueuedMessage);
	}

	async ack(recipientId: string, messageId: string): Promise<void> {
		const key = queueKey(recipientId);
		const raw = await redis.lrange(key, 0, -1);
		const remaining = raw.filter(
			(entry) => (JSON.parse(entry) as QueuedMessage).messageId !== messageId,
		);

		if (remaining.length === raw.length) {
			return;
		}

		const pipeline = redis.multi().del(key);
		if (remaining.length > 0) {
			pipeline.rpush(key, ...remaining).expire(key, QUEUE_TTL_SECONDS);
		}
		await pipeline.exec();
	}
}

export const relayStore = new RelayStore();
