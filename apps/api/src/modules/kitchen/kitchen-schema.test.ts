import { describe, expect, test } from "bun:test";

import { PutKitchenRequestSchema } from "./kitchen-schema";

describe("PutKitchenRequestSchema", () => {
	test("accepts empty equipment", () => {
		expect(PutKitchenRequestSchema.parse({ equipment: [] })).toEqual({
			equipment: [],
		});
	});

	test("trims equipment while preserving submitted case", () => {
		expect(
			PutKitchenRequestSchema.parse({
				equipment: ["  wajan  ", " Blender "],
			}),
		).toEqual({ equipment: ["wajan", "Blender"] });
	});

	test("rejects blank, exact duplicate, and case-only duplicate equipment", () => {
		for (const equipment of [
			["   "],
			["wajan", " wajan "],
			["wajan", "Wajan"],
		]) {
			expect(PutKitchenRequestSchema.safeParse({ equipment }).success).toBe(
				false,
			);
		}
	});

	test("rejects missing and unknown fields without inventing a length limit", () => {
		expect(PutKitchenRequestSchema.safeParse({}).success).toBe(false);
		expect(
			PutKitchenRequestSchema.safeParse({
				equipment: [],
				userId: crypto.randomUUID(),
			}).success,
		).toBe(false);
		expect(
			PutKitchenRequestSchema.safeParse({ equipment: ["x".repeat(10_000)] })
				.success,
		).toBe(true);
	});
});
