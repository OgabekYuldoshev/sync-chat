import type { User } from "@/shared/types/user";

export type NearbyUser = User & {
	isConnected: boolean;
	isConnecting: boolean;
};
