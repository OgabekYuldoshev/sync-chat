import { Hono } from "hono";

/**
 * Mounted at /hono (not /api) so it never competes with Next's own
 * app/api/* Route Handlers — see skills/nextjs.md. Add real routes here as
 * they come up; this file is the one place custom-server-level HTTP
 * endpoints live, separate from the WebSocket signaling server.
 */
export const honoApp = new Hono().basePath("/hono");

honoApp.get("/health", (c) =>
	c.json({ status: "ok", timestamp: new Date().toISOString() }),
);
