import { expect, test } from "bun:test";
import {
	COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH,
	CookingSessionCustomNameSchema,
	CookingSessionResponseSchema,
	UpdateCookingSessionRequestSchema,
} from "./cooking-session";

test("Cooking Session responses accept an absent custom name", () => {
	expect(
		CookingSessionResponseSchema.shape.customName.safeParse(undefined).success,
	).toBe(true);
});

test("custom names are trimmed and bounded", () => {
	expect(
		CookingSessionCustomNameSchema.parse("  Weeknight nasi goreng  "),
	).toBe("Weeknight nasi goreng");
	expect(
		CookingSessionCustomNameSchema.safeParse(
			"x".repeat(COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH + 1),
		).success,
	).toBe(false);
});

test("rename requests accept null to restore the original recipe name", () => {
	expect(UpdateCookingSessionRequestSchema.parse({ customName: null })).toEqual(
		{
			customName: null,
		},
	);
});

test("rename requests reject whitespace-only names", () => {
	expect(
		UpdateCookingSessionRequestSchema.safeParse({ customName: "   " }).success,
	).toBe(false);
});
