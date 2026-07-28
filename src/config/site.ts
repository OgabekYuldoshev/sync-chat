export const siteConfig = {
	name: "PeerChat",
	description: "Secure messaging and file sharing, wherever you are.",
} as const;

export type NavItem = {
	title: string;
	href: string;
	icon: "chats" | "nearby" | "settings";
};

export const NAV_ITEMS: NavItem[] = [
	{ title: "Chats", href: "/", icon: "chats" },
	{ title: "Nearby", href: "/nearby", icon: "nearby" },
	{ title: "Settings", href: "/settings", icon: "settings" },
];
