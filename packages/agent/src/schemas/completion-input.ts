import { z } from "zod";

import {
	ActiveCookingPlanSessionSchema,
	CompletedActiveCookingSessionSchema,
} from "./active-cooking-input";

export const CompletionInputSchema = ActiveCookingPlanSessionSchema.safeExtend({
	session: CompletedActiveCookingSessionSchema,
	message: z.string().trim().min(1).optional(),
});

export type CompletionInput = z.infer<typeof CompletionInputSchema>;
