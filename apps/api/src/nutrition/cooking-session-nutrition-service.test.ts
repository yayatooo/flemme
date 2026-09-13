import { describe, expect, test } from "bun:test";
import type { PreCookingOutput } from "@flemme/agent";
import { RecipeNutritionResultSchema } from "@flemme/nutrition";

import { createApp } from "../app";
import {
	CompleteCookingSessionRequestSchema,
	CreateCookingSessionRequestSchema,
} from "../cooking-session/cooking-session-schema";
import { calculateCookingSessionNutrition } from "./cooking-session-nutrition-service";

function planWithIngredients(
	ingredients: PreCookingOutput["ingredients"],
): PreCookingOutput {
	return {
		preparationSummary: { overview: "Prepare the nutrition test recipe." },
		ingredients,
		equipment: [],
		preparationSteps: [],
		cookingStages: [
			{
				id: "cook",
				title: "Cook",
				steps: [{ id: "serve", instruction: "Serve." }],
			},
		],
	};
}

describe("calculateCookingSessionNutrition", () => {
	test("uses direct masses and verified production portions", () => {
		const result = calculateCookingSessionNutrition({
			cookingPlan: planWithIngredients([
				{ name: "tomat", quantity: 100, unit: "gram" },
				{ name: "minyak kanola", quantity: 1, unit: "sdm" },
				{ name: "garam", quantity: 1, unit: "sdt" },
			]),
			servings: 2,
		});

		expect(RecipeNutritionResultSchema.parse(result)).toEqual(result);
		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total.caloriesKcal).toBeGreaterThan(0);
			expect(result.perServing.caloriesKcal).toBe(
				result.total.caloriesKcal / 2,
			);
		}
	});

	test("returns partial with conservative coverage issues", () => {
		const result = calculateCookingSessionNutrition({
			cookingPlan: planWithIngredients([
				{ name: "tomato", quantity: 100, unit: "g" },
				{ name: "egg", quantity: 1, unit: "piece" },
				{ name: "potato", quantity: 1, unit: "cup" },
			]),
			servings: 1,
		});

		expect(result.status).toBe("partial");
		if (result.status === "partial") {
			expect(result.issues).toEqual([
				{
					reason: "portion-unavailable",
					ingredientName: "egg",
					ingredientKey: "egg",
					unit: "piece",
				},
				{
					reason: "unit-unsupported",
					ingredientName: "potato",
					ingredientKey: "potato",
					unit: "cup",
				},
			]);
		}
	});

	test("returns unavailable with no totals for the historical Telur Kecap shape", () => {
		const result = calculateCookingSessionNutrition({
			cookingPlan: planWithIngredients([
				{ name: "telur", quantity: 4, unit: "butir" },
				{ name: "kecap manis", quantity: 4, unit: "sendok makan" },
				{ name: "bawang merah", quantity: 4, unit: "butir" },
				{ name: "bawang putih", quantity: 2, unit: "siung (besar)" },
				{ name: "minyak goreng", quantity: 2, unit: "sendok makan" },
				{ name: "garam" },
			]),
			servings: 2,
		});

		expect(result.status).toBe("unavailable");
		expect("total" in result).toBe(false);
		expect("perServing" in result).toBe(false);
		if (result.status === "unavailable") {
			expect(result.issues.map(({ reason }) => reason)).toEqual([
				"portion-unavailable",
				"ingredient-unresolved",
				"portion-unavailable",
				"unit-unsupported",
				"ingredient-unresolved",
				"quantity-missing",
			]);
		}
	});

	test("publishes nutrition preview and rejects client nutrition contracts", async () => {
		const app = createApp({ db: {} as never });
		const response = await app.request("/openapi.json");
		const specification = (await response.json()) as {
			paths: Record<
				string,
				{ post?: { requestBody?: unknown }; get?: unknown } | undefined
			>;
		};
		const forgedNutrition = {
			status: "complete",
			estimated: true,
			servings: 1,
			total: { caloriesKcal: 1, proteinG: 1, carbsG: 1, fatG: 1 },
			perServing: { caloriesKcal: 1, proteinG: 1, carbsG: 1, fatG: 1 },
		};
		const cookingPlan = planWithIngredients([
			{ name: "tomato", quantity: 100, unit: "g" },
		]);
		const selectedRecipe = {
			name: "Tomato",
			description: "A tomato recipe.",
			reason: "Uses one supported ingredient.",
			estimatedDuration: { minMinutes: 1, maxMinutes: 2 },
			servings: 1,
			feasibility: "ready" as const,
			ingredients: [{ name: "tomato", status: "available" as const }],
			equipment: [],
			preferenceMatches: [],
			requiredConfirmations: [],
			optionalIngredients: [],
			warnings: [],
		};

		expect(response.status).toBe(200);
		expect(specification.paths).toHaveProperty(
			"/cooking-sessions/{id}/nutrition",
		);
		expect(
			JSON.stringify(
				specification.paths["/cooking-sessions/{id}/complete"]?.post
					?.requestBody,
			),
		).not.toContain("nutritionSnapshot");
		expect(
			CompleteCookingSessionRequestSchema.safeParse({
				completionSnapshot: {
					reply: "Done",
					summary: { title: "Done", description: "Done cooking." },
					notes: [],
				},
				nutritionSnapshot: forgedNutrition,
			}).success,
		).toBe(false);
		expect(
			CreateCookingSessionRequestSchema.safeParse({
				recommendationSnapshot: {
					type: "recommendations",
					recommendations: [selectedRecipe],
				},
				selectedRecipeSnapshot: selectedRecipe,
				cookingPlan,
				session: {
					status: "active",
					currentStageId: "cook",
					currentStepId: "serve",
					completedStepIds: [],
					changes: [],
				},
				nutritionSnapshot: forgedNutrition,
			}).success,
		).toBe(false);
	});
});
