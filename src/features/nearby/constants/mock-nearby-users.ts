import type { NearbyUser } from "@/features/nearby/types/nearby-user";

export const MOCK_NEARBY_USERS: NearbyUser[] = [
	{
		id: "nearby-1",
		name: "Sara Kim",
		avatarUrl: null,
		status: "online",
		distanceLabel: "3 m away",
		isConnected: true,
	},
	{
		id: "nearby-2",
		name: "Omar Farouk",
		avatarUrl: null,
		status: "online",
		distanceLabel: "8 m away",
		isConnected: false,
	},
	{
		id: "nearby-3",
		name: "Elif Yildiz",
		avatarUrl: null,
		status: "away",
		distanceLabel: "15 m away",
		isConnected: false,
	},
];
