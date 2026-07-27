import { z } from "zod";

export const updateDisplayNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(40, "Name is too long"),
});
