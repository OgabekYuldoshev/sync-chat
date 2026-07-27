export type UserStatus = "online" | "away" | "offline";

export type User = {
	id: string;
	name: string;
	avatarUrl: string | null;
	status: UserStatus;
};
