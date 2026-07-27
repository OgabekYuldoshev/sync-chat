import { createServer } from "node:http";
import next from "next";
import { attachSignalingServer, isSignalingUpgrade } from "./signaling-server";

const port = Number(process.env.PORT ?? 6677);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handleRequest = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((request, response) => {
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
