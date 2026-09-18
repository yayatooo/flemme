import { describe, expect, test } from "bun:test";
import { UpdateCurrentUserRequestSchema } from "./current-user-route";

describe("UpdateCurrentUserRequestSchema", () => {
	test("trims a non-empty display name", () => {
		expect(
			UpdateCurrentUserRequestSchema.parse({ name: "  Tiara Putri  " }),
		).toEqual({
			name: "Tiara Putri",
		});
	});

	test("rejects blank names and unknown account fields", () => {
		expect(
			UpdateCurrentUserRequestSchema.safeParse({ name: "   " }).success,
		).toBe(false);
		expect(
			UpdateCurrentUserRequestSchema.safeParse({
				name: "Tiara",
				email: "changed@example.com",
			}).success,
		).toBe(false);
	});
});
