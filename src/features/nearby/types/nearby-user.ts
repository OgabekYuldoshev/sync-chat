import type { User } from "@/shared/types/user";

export type NearbyUser = User & {
	distanceLabel: string;
	isConnected: boolean;
};
