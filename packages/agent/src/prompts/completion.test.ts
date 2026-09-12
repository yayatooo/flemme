import { expect, test } from "bun:test";

import {
	AYAM_KECAP_COMPLETED_SESSION,
	AYAM_KECAP_COOKING_PLAN,
} from "../fixtures/ayam-kecap-cooking-plan";
import { CompletionInputSchema } from "../schemas/completion-input";
import { createCompletionPrompt } from "./completion";

test("builds a grounded Completion prompt without changing its input", () => {
	const input = CompletionInputSchema.parse({
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			...AYAM_KECAP_COMPLETED_SESSION,
			changes: [
				{
					kind: "ingredient",
					description: "User added more salt during cooking.",
					relatedStepId: "finish-and-taste",
				},
			],
		},
		message: "selesai, agak keasinan",
	});
	const inputBeforePrompt = JSON.stringify(input);

	const prompt = createCompletionPrompt(input);

	expect(prompt).toContain('"status": "completed"');
	expect(prompt).toContain('"message": "selesai, agak keasinan"');
	expect(prompt).toContain("Completion is not Active Cooking");
	expect(prompt).toContain("Do not regenerate");
	expect(prompt).toContain("history, favorites, ratings");
	expect(prompt).toContain("without evidence");
	expect(prompt).toContain("Use recorded changes selectively");
	expect(prompt).toContain("Prefer [] when nothing useful remains");
	expect(JSON.stringify(input)).toBe(inputBeforePrompt);
});

test("supports Completion without a final user message", () => {
	const input = CompletionInputSchema.parse({
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
	});

	const prompt = createCompletionPrompt(input);

	expect(prompt).toContain('"status": "completed"');
	expect(prompt).not.toContain('"message"');
});
