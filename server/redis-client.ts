import Redis from "ioredis";

/**
 * Single shared Redis connection for the server process. Backs the relay
 * store (offline message queue) so queued messages survive restarts and
 * would keep working if the app were ever run behind more than one process.
 */
export const redis = new Redis(
	process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
	{
		maxRetriesPerRequest: 3,
		lazyConnect: false,
	},
);

redis.on("error", (error) => {
	console.error("[redis] connection error:", error.message);
});
