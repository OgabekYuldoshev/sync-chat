import { createServer } from "node:http";
import next from "next";
import { redis } from "./redis-client";
import { attachSignalingServer, isSignalingUpgrade } from "./signaling-server";

const port = Number(process.env.PORT ?? 6677);
const dev = process.env.NODE_ENV !== "production";
const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = next({ dev });
const handleRequest = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((request, response) => {
	handleRequest(request, response);
});

const closeSignalingServer = attachSignalingServer(httpServer);

const handleUpgrade = app.getUpgradeHandler();

httpServer.on("upgrade", (request, socket, head) => {
	if (isSignalingUpgrade(request.url)) {
		return;
	}

	handleUpgrade(request, socket, head);
});

httpServer.listen(port, () => {
	console.log(`> PeerChat ready on http://localhost:${port}`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;

	console.log(`> ${signal} received, shutting down gracefully...`);

	const forceExit = setTimeout(() => {
		console.error("> Shutdown timed out, forcing exit.");
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	forceExit.unref();

	closeSignalingServer();

	httpServer.close(async (error) => {
		if (error) {
			console.error("> Error while closing HTTP server:", error);
		}

		await redis.quit().catch((redisError) => {
			console.error("> Error while closing Redis connection:", redisError);
		});

		clearTimeout(forceExit);
		process.exit(error ? 1 : 0);
	});
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
