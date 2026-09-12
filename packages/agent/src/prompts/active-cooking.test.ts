import { expect, test } from "bun:test";

import { AYAM_KECAP_COOKING_PLAN } from "../fixtures/ayam-kecap-cooking-plan";
import { ActiveCookingInputSchema } from "../schemas/active-cooking-input";
import { createActiveCookingPrompt } from "./active-cooking";

test("builds an Active Cooking prompt from the exact validated position", () => {
	const input = ActiveCookingInputSchema.parse({
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-aromatics",
			currentStepId: "heat-oil",
			completedStepIds: [
				"prep-cut-chicken",
				"prep-slice-aromatics",
				"prep-measure-sauce",
			],
			changes: [],
		},
		message: "sekarang aku harus ngapain?",
	});
	const inputBeforePrompt = JSON.stringify(input);

	const prompt = createActiveCookingPrompt(input);

	expect(prompt).toContain('"id": "stage-cook-aromatics"');
	expect(prompt).toContain('"id": "heat-oil"');
	expect(prompt).toContain('"message": "sekarang aku harus ngapain?"');
	expect(prompt).toContain("Guidance that does not propose a session change");
	expect(prompt).toContain("Do not return a replacement session");
	expect(JSON.stringify(input)).toBe(inputBeforePrompt);
});
