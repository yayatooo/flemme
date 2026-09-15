import { describe, expect, test } from "bun:test";

import { PutKitchenRequestSchema } from "./kitchen-schema";

describe("PutKitchenRequestSchema", () => {
	test("accepts unique canonical equipment keys", () => {
		expect(
			PutKitchenRequestSchema.parse({
				equipment: ["stove", "frying-pan", "rice-cooker"],
			}),
		).toEqual({ equipment: ["stove", "frying-pan", "rice-cooker"] });
	});

	test("rejects an empty selection, unsupported keys, and duplicates", () => {
		for (const equipment of [
			[],
			["wajan"],
			["stove", "stove"],
			["Rice Cooker"],
		]) {
			expect(PutKitchenRequestSchema.safeParse({ equipment }).success).toBe(
				false,
			);
		}
	});

	test("rejects missing and unknown fields", () => {
		expect(PutKitchenRequestSchema.safeParse({}).success).toBe(false);
		expect(
			PutKitchenRequestSchema.safeParse({
				equipment: ["stove"],
				userId: crypto.randomUUID(),
			}).success,
		).toBe(false);
	});
});
