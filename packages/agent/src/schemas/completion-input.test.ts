import { describe, expect, test } from "bun:test";

import {
	AYAM_KECAP_COMPLETED_SESSION,
	AYAM_KECAP_COOKING_PLAN,
} from "../fixtures/ayam-kecap-cooking-plan";
import { CompletionInputSchema } from "./completion-input";

const completedSession = {
	...AYAM_KECAP_COMPLETED_SESSION,
	changes: [
		{
			kind: "ingredient",
			description: "A little more salt was added while finishing the sauce.",
			relatedStepId: "finish-and-taste",
		},
	],
};

describe("CompletionInputSchema", () => {
	test("accepts a completed session without a final message", () => {
		const result = CompletionInputSchema.safeParse({
			cookingPlan: AYAM_KECAP_COOKING_PLAN,
			session: completedSession,
		});

		expect(result.success).toBe(true);
	});

	test("accepts a completed session with a final message", () => {
		const result = CompletionInputSchema.safeParse({
			cookingPlan: AYAM_KECAP_COOKING_PLAN,
			session: completedSession,
			message: "selesai, agak keasinan",
		});

		expect(result.success).toBe(true);
	});

	test.each([
		{ status: "active" },
		{ status: "paused", pauseReason: "user-request" },
		{ status: "abandoned" },
	])("rejects a $status session", (statusFields) => {
		const result = CompletionInputSchema.safeParse({
			cookingPlan: AYAM_KECAP_COOKING_PLAN,
			session: {
				...completedSession,
				...statusFields,
			},
		});

		expect(result.success).toBe(false);
	});

	test("preserves Active Cooking plan-position validation", () => {
		const result = CompletionInputSchema.safeParse({
			cookingPlan: AYAM_KECAP_COOKING_PLAN,
			session: {
				...completedSession,
				currentStepId: "unknown-step",
			},
		});

		expect(result.success).toBe(false);
	});

	test("rejects an empty final message", () => {
		const result = CompletionInputSchema.safeParse({
			cookingPlan: AYAM_KECAP_COOKING_PLAN,
			session: completedSession,
			message: " ",
		});

		expect(result.success).toBe(false);
	});
});
