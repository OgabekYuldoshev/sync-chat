import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";
import next from "next";
import { honoApp } from "./server/hono-app";
import {
	attachSignalingServer,
	isSignalingUpgrade,
} from "./server/signaling-server";

const port = Number(process.env.PORT ?? 6677);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handleRequest = app.getRequestHandler();
const handleHonoRequest = getRequestListener(honoApp.fetch);

await app.prepare();

const httpServer = createServer((request, response) => {
	if (request.url?.startsWith("/hono")) {
		handleHonoRequest(request, response);
		return;
	}

	handleRequest(request, response);
});

attachSignalingServer(httpServer);

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
