import { describe, expect, test } from "bun:test";

import { PutHouseholdRequestSchema } from "./household-schema";

describe("PutHouseholdRequestSchema", () => {
	test("accepts household counts with at least one member", () => {
		expect(
			PutHouseholdRequestSchema.parse({
				adults: 1,
				children: 0,
				toddlers: 0,
			}),
		).toEqual({ adults: 1, children: 0, toddlers: 0 });
	});

	test("accepts the defensive maximum for every category", () => {
		expect(
			PutHouseholdRequestSchema.safeParse({
				adults: 20,
				children: 20,
				toddlers: 20,
			}).success,
		).toBe(true);
	});

	test("rejects empty, negative, fractional, oversized, missing, and unknown values", () => {
		const invalidInputs = [
			{ adults: 0, children: 0, toddlers: 0 },
			{ adults: -1, children: 0, toddlers: 0 },
			{ adults: 1.5, children: 0, toddlers: 0 },
			{ adults: 21, children: 0, toddlers: 0 },
			{ adults: 1, children: 0 },
			{ adults: 1, children: 0, toddlers: 0, userId: crypto.randomUUID() },
		];

		for (const input of invalidInputs) {
			expect(PutHouseholdRequestSchema.safeParse(input).success).toBe(false);
		}
	});
});
