import { z } from "@hono/zod-openapi";

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const HOUSEHOLD_COUNT_MAX = 20;

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

export const PutHouseholdRequestSchema = HouseholdResponseSchema.extend({
	adults: HouseholdCountSchema.max(HOUSEHOLD_COUNT_MAX),
	children: HouseholdCountSchema.max(HOUSEHOLD_COUNT_MAX),
	toddlers: HouseholdCountSchema.max(HOUSEHOLD_COUNT_MAX),
})
	.strict()
	.refine(
		({ adults, children, toddlers }) => adults + children + toddlers >= 1,
		{ message: "At least one household member is required" },
	);

export type PutHouseholdRequest = z.infer<typeof PutHouseholdRequestSchema>;
