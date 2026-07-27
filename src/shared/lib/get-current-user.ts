import { cookies } from "next/headers";
import {
	DEVICE_ID_COOKIE,
	DISPLAY_NAME_COOKIE,
} from "@/shared/constants/cookies";
import type { User } from "@/shared/types/user";
import { generateGuestName } from "@/shared/utils/generate-guest-name";

export type CurrentUser = User & {
	deviceId: string;
	hasCustomName: boolean;
};

const FALLBACK_DEVICE_ID = "unassigned";

export async function getCurrentUser(): Promise<CurrentUser> {
	const cookieStore = await cookies();
	const deviceId =
		cookieStore.get(DEVICE_ID_COOKIE)?.value ?? FALLBACK_DEVICE_ID;
	const customName = cookieStore.get(DISPLAY_NAME_COOKIE)?.value;

	return {
		id: deviceId,
		deviceId,
		name: customName || generateGuestName(deviceId),
		hasCustomName: Boolean(customName),
		avatarUrl: null,
		status: "online",
	};
}
