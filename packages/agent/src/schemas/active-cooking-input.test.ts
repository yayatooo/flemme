import { describe, expect, test } from "bun:test";

import { ActiveCookingInputSchema } from "./active-cooking-input";

const cookingPlan = {
	preparationSummary: {
		overview: "Prepare and cook ayam kecap.",
	},
	ingredients: [{ name: "chicken", quantity: 500, unit: "g" }],
	equipment: [{ name: "stove", required: true }],
	preparationSteps: [
		{
			id: "prep-cut-chicken",
			instruction: "Cut the chicken into pieces.",
		},
	],
	cookingStages: [
		{
			id: "stage-brown-chicken",
			title: "Brown the chicken",
			steps: [
				{
					id: "cook-heat-pan",
					instruction: "Heat the pan.",
				},
				{
					id: "cook-brown-chicken",
					instruction: "Brown the chicken.",
				},
			],
		},
		{
			id: "stage-simmer-sauce",
			title: "Simmer the sauce",
			steps: [
				{
					id: "cook-add-sauce",
					instruction: "Add the sauce.",
				},
			],
		},
	],
};

describe("ActiveCookingInputSchema", () => {
	test.each([
		{
			name: "cooking just started",
			session: {
				status: "active",
				currentStageId: "stage-brown-chicken",
				currentStepId: "cook-heat-pan",
				completedStepIds: [],
				changes: [],
			},
			message: "mulai",
		},
		{
			name: "cooking in progress",
			session: {
				status: "active",
				currentStageId: "stage-simmer-sauce",
				currentStepId: "cook-add-sauce",
				completedStepIds: [
					"prep-cut-chicken",
					"cook-heat-pan",
					"cook-brown-chicken",
				],
				changes: [],
			},
			message: "step ini sudah selesai",
		},
		{
			name: "paused for a missing ingredient",
			session: {
				status: "paused",
				pauseReason: "missing-ingredient",
				currentStageId: "stage-simmer-sauce",
				currentStepId: "cook-add-sauce",
				completedStepIds: [
					"prep-cut-chicken",
					"cook-heat-pan",
					"cook-brown-chicken",
				],
				changes: [
					{
						kind: "ingredient",
						description: "Sweet soy sauce is unavailable.",
						relatedStepId: "cook-add-sauce",
					},
				],
			},
			message: "aku mau beli kecap dulu",
		},
		{
			name: "resumed after the ingredient becomes available",
			session: {
				status: "active",
				currentStageId: "stage-simmer-sauce",
				currentStepId: "cook-add-sauce",
				completedStepIds: [
					"prep-cut-chicken",
					"cook-heat-pan",
					"cook-brown-chicken",
				],
				changes: [
					{
						kind: "ingredient",
						description: "Sweet soy sauce is now available.",
						relatedStepId: "cook-add-sauce",
					},
				],
			},
			message: "kecapnya sudah ada, lanjut",
		},
		{
			name: "interrupted by unavailable equipment",
			session: {
				status: "paused",
				pauseReason: "missing-equipment",
				currentStageId: "stage-brown-chicken",
				currentStepId: "cook-brown-chicken",
				completedStepIds: ["prep-cut-chicken", "cook-heat-pan"],
				changes: [
					{
						kind: "equipment",
						description: "The gas supply ran out.",
						relatedStepId: "cook-brown-chicken",
					},
				],
			},
			message: "gas habis",
		},
	])("accepts $name", ({ session, message }) => {
		const result = ActiveCookingInputSchema.safeParse({
			cookingPlan,
			session,
			message,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cookingPlan).toEqual(cookingPlan);
		}
	});

	test.each([
		{
			name: "an unknown current stage",
			change: { currentStageId: "unknown-stage" },
		},
		{
			name: "a current step outside the current stage",
			change: { currentStepId: "cook-add-sauce" },
		},
		{
			name: "an unknown completed step",
			change: { completedStepIds: ["unknown-step"] },
		},
		{
			name: "duplicate completed steps",
			change: { completedStepIds: ["prep-cut-chicken", "prep-cut-chicken"] },
		},
	])("rejects $name", ({ change }) => {
		const result = ActiveCookingInputSchema.safeParse({
			cookingPlan,
			session: {
				status: "active",
				currentStageId: "stage-brown-chicken",
				currentStepId: "cook-heat-pan",
				completedStepIds: [],
				changes: [],
				...change,
			},
			message: "lanjut",
		});

		expect(result.success).toBe(false);
	});

	test("rejects a change that references an unknown plan step", () => {
		const result = ActiveCookingInputSchema.safeParse({
			cookingPlan,
			session: {
				status: "active",
				currentStageId: "stage-brown-chicken",
				currentStepId: "cook-heat-pan",
				completedStepIds: [],
				changes: [
					{
						kind: "step",
						description: "A step changed.",
						relatedStepId: "unknown-step",
					},
				],
			},
			message: "lanjut",
		});

		expect(result.success).toBe(false);
	});

	test("rejects duplicate step IDs in the cooking plan", () => {
		const result = ActiveCookingInputSchema.safeParse({
			cookingPlan: {
				...cookingPlan,
				preparationSteps: [
					...cookingPlan.preparationSteps,
					{
						id: "cook-heat-pan",
						instruction: "Duplicate step ID.",
					},
				],
			},
			session: {
				status: "active",
				currentStageId: "stage-brown-chicken",
				currentStepId: "cook-heat-pan",
				completedStepIds: [],
				changes: [],
			},
			message: "lanjut",
		});

		expect(result.success).toBe(false);
	});
});
