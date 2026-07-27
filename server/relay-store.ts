import type { EncryptedEnvelope } from "@/shared/lib/ws/signaling-protocol";

export type QueuedMessage = {
	messageId: string;
	from: string;
	envelope: EncryptedEnvelope;
};

const MAX_QUEUED_PER_RECIPIENT = 200;

/**
 * In-memory store-and-forward queue for messages sent while the recipient is
 * offline. Single-process only — swap for Redis/Postgres before running more
 * than one server instance or needing delivery to survive a restart.
 */
class RelayStore {
	private readonly queues = new Map<string, QueuedMessage[]>();

	enqueue(recipientId: string, message: QueuedMessage): void {
		const queue = this.queues.get(recipientId) ?? [];
		queue.push(message);

		if (queue.length > MAX_QUEUED_PER_RECIPIENT) {
			queue.shift();
		}

		this.queues.set(recipientId, queue);
	}

	drain(recipientId: string): QueuedMessage[] {
		return this.queues.get(recipientId) ?? [];
	}

	ack(recipientId: string, messageId: string): void {
		const queue = this.queues.get(recipientId);
		if (!queue) {
			return;
		}

		this.queues.set(
			recipientId,
			queue.filter((message) => message.messageId !== messageId),
		);
	}
}

export const relayStore = new RelayStore();
