import type { PreCookingInput } from "../../index";
import { BASE_PRE_COOKING_INPUT } from "../fixtures/cooking-context";
import type { FlemmeEvalCase } from "../types";

export const preCookingCases: Array<
	FlemmeEvalCase<PreCookingInput, { requiredEquipment: string[] }>
> = [
	{
		id: "pre-cooking-standard-plan",
		input: BASE_PRE_COOKING_INPUT,
		expected: { requiredEquipment: ["wok", "gas stove"] },
		metadata: {
			category: "standard-plan",
			intent: "prepare-selected-recipe",
			phase: "pre-cooking",
		},
	},
	{
		id: "pre-cooking-unknown-quantities",
		input: {
			...BASE_PRE_COOKING_INPUT,
			selectedRecipe: {
				...BASE_PRE_COOKING_INPUT.selectedRecipe,
				ingredients: BASE_PRE_COOKING_INPUT.selectedRecipe.ingredients.map(
					({ requiredAmount: _, ...ingredient }) => ingredient,
				),
			},
		},
		expected: { requiredEquipment: ["wok", "gas stove"] },
		metadata: {
			category: "unknown-quantities",
			intent: "prepare-selected-recipe",
			phase: "pre-cooking",
		},
	},
	{
		id: "pre-cooking-limited-equipment",
		input: {
			...BASE_PRE_COOKING_INPUT,
			context: {
				...BASE_PRE_COOKING_INPUT.context,
				kitchen: {
					equipment: [
						"frying pan",
						"gas stove",
						"knife",
						"cutting board",
						"spatula",
					],
				},
			},
			selectedRecipe: {
				...BASE_PRE_COOKING_INPUT.selectedRecipe,
				equipment: BASE_PRE_COOKING_INPUT.selectedRecipe.equipment.map(
					(equipment) =>
						equipment.name === "wok"
							? { name: "frying pan", status: "available" as const }
							: equipment,
				),
			},
		},
		expected: { requiredEquipment: ["frying pan", "gas stove"] },
		metadata: {
			category: "equipment-adaptation",
			intent: "prepare-selected-recipe",
			phase: "pre-cooking",
		},
	},
];
