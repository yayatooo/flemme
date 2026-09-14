import { describe, expect, test } from "bun:test";

import { PutHouseholdRequestSchema } from "./household-schema";

describe("PutHouseholdRequestSchema", () => {
	test("accepts non-negative integer counts including zero", () => {
		expect(
			PutHouseholdRequestSchema.parse({
				adults: 0,
				children: 0,
				toddlers: 0,
			}),
		).toEqual({ adults: 0, children: 0, toddlers: 0 });
	});

	test("accepts the PostgreSQL integer maximum", () => {
		expect(
			PutHouseholdRequestSchema.safeParse({
				adults: 2_147_483_647,
				children: 0,
				toddlers: 0,
			}).success,
		).toBe(true);
	});

	test("rejects negative, fractional, oversized, missing, and unknown values", () => {
		const invalidInputs = [
			{ adults: -1, children: 0, toddlers: 0 },
			{ adults: 1.5, children: 0, toddlers: 0 },
			{ adults: 2_147_483_648, children: 0, toddlers: 0 },
			{ adults: 1, children: 0 },
			{ adults: 1, children: 0, toddlers: 0, userId: crypto.randomUUID() },
		];

		for (const input of invalidInputs) {
			expect(PutHouseholdRequestSchema.safeParse(input).success).toBe(false);
		}
	});
});
