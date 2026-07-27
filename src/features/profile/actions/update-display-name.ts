"use server";

import { createAction } from "actium";
import { cookies } from "next/headers";
import { DISPLAY_NAME_COOKIE } from "@/shared/constants/cookies";
import { updateDisplayNameSchema } from "../validation/update-display-name-schema";

const TWO_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 2;

export const updateDisplayName = createAction()
	.input(updateDisplayNameSchema)
	.handler(async ({ input }) => {
		const cookieStore = await cookies();

		cookieStore.set(DISPLAY_NAME_COOKIE, input.name, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: TWO_YEARS_IN_SECONDS,
			path: "/",
		});

		return { name: input.name };
	});
