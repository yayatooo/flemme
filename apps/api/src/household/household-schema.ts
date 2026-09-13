import { z } from "@hono/zod-openapi";

const POSTGRES_INTEGER_MAX = 2_147_483_647;

const HouseholdCountSchema = z
	.number()
	.int()
	.nonnegative()
	.max(POSTGRES_INTEGER_MAX);

export const HouseholdResponseSchema = z.object({
	adults: HouseholdCountSchema,
	children: HouseholdCountSchema,
	toddlers: HouseholdCountSchema,
});

export type HouseholdResponse = z.infer<typeof HouseholdResponseSchema>;

export const PutHouseholdRequestSchema = HouseholdResponseSchema.strict();

export type PutHouseholdRequest = z.infer<typeof PutHouseholdRequestSchema>;
