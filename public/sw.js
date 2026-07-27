// PeerChat service worker: only handles Web Push wake-ups. The server never
// puts plaintext in the push payload (it holds no decryption keys), so this
// shows a generic notification — the real, encrypted message is fetched over
// the signaling WebSocket once the app is open again.

self.addEventListener("push", (event) => {
	let payload = {};
	try {
		payload = event.data ? event.data.json() : {};
	} catch {
		payload = {};
	}

	const title = payload.title || "PeerChat";
	const options = {
		body: payload.body || "You have a new message.",
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		tag: "peerchat-message",
		renotify: true,
		data: { url: payload.url || "/" },
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const targetUrl = event.notification.data?.url || "/";

	event.waitUntil(
		(async () => {
			const allClients = await clients.matchAll({
				type: "window",
				includeUncontrolled: true,
			});

			for (const client of allClients) {
				if (client.url.startsWith(self.location.origin) && "focus" in client) {
					await client.focus();
					return;
				}
			}

			await clients.openWindow(targetUrl);
		})(),
	);
});
