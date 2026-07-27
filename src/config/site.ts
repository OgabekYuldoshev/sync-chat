export const siteConfig = {
	name: "PeerChat",
	description: "Secure messaging and file sharing, wherever you are.",
} as const;

export type NavItem = {
	title: string;
	href: string;
	icon: "chats" | "nearby" | "qr" | "transfers" | "settings";
};

export const NAV_ITEMS: NavItem[] = [
	{ title: "Chats", href: "/", icon: "chats" },
	{ title: "Nearby", href: "/nearby", icon: "nearby" },
	{ title: "QR Connect", href: "/qr-connect", icon: "qr" },
	{ title: "Transfers", href: "/transfers", icon: "transfers" },
	{ title: "Settings", href: "/settings", icon: "settings" },
];
