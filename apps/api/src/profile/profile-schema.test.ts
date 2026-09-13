import { describe, expect, test } from "bun:test";

import { PutProfileRequestSchema } from "./profile-schema";

describe("PutProfileRequestSchema", () => {
	test("accepts empty preference arrays", () => {
		expect(
			PutProfileRequestSchema.parse({
				foodPreferences: [],
				cookingPreferences: [],
			}),
		).toEqual({ foodPreferences: [], cookingPreferences: [] });
	});

	test("trims persisted preference values", () => {
		expect(
			PutProfileRequestSchema.parse({
				foodPreferences: ["  spicy  "],
				cookingPreferences: ["  one wok  "],
			}),
		).toEqual({
			foodPreferences: ["spicy"],
			cookingPreferences: ["one wok"],
		});
	});

	test("rejects partial, blank, and unknown fields", () => {
		expect(
			PutProfileRequestSchema.safeParse({ foodPreferences: [] }).success,
		).toBe(false);
		expect(
			PutProfileRequestSchema.safeParse({
				foodPreferences: ["   "],
				cookingPreferences: [],
			}).success,
		).toBe(false);
		expect(
			PutProfileRequestSchema.safeParse({
				foodPreferences: [],
				cookingPreferences: [],
				userId: crypto.randomUUID(),
			}).success,
		).toBe(false);
	});
});
