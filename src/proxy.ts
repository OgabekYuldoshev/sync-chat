import { type NextRequest, NextResponse } from "next/server";
import { DEVICE_ID_COOKIE } from "@/shared/constants/cookies";

const TWO_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 2;

export function proxy(request: NextRequest) {
	const response = NextResponse.next();

	if (!request.cookies.has(DEVICE_ID_COOKIE)) {
		response.cookies.set(DEVICE_ID_COOKIE, crypto.randomUUID(), {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: TWO_YEARS_IN_SECONDS,
			path: "/",
		});
	}

	return response;
}

export const config = {
	matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
