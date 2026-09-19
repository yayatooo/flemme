import { createEvalTypes, EvalOutcome } from "@anvia/core/evals";
import type {
	CookingRecommendationInput,
	CookingRecommendationOutput,
} from "../../index";
import { CookingRecommendationOutputSchema } from "../../index";
import type { RecommendationExpectation } from "../types";

const { defineMetric } = createEvalTypes<
	CookingRecommendationInput,
	CookingRecommendationOutput,
	RecommendationExpectation
>();

function normalize(value: string) {
	return value.normalize("NFKD").trim().toLocaleLowerCase("en");
}

function result(ok: boolean, comment: string) {
	return ok
		? EvalOutcome.pass(true, { comment })
		: EvalOutcome.fail(false, { comment });
}

export const recommendationSchemaMetric = defineMetric({
	name: "recommendation-schema",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output }) =>
		result(
			CookingRecommendationOutputSchema.safeParse(output).success,
			"Output must pass the production recommendation schema.",
		),
});

export const recommendationVariantMetric = defineMetric({
	name: "recommendation-variant-contract",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		const allowed = testCase.expected?.allowedVariants ?? [];
		const countValid =
			output.type !== "recommendations" ||
			(output.recommendations.length >= 1 &&
				output.recommendations.length <= 3);
		return result(
			allowed.includes(output.type) && countValid,
			`Variant ${output.type} must be allowed and recommendation cardinality must be 1–3.`,
		);
	},
});

export const recommendationServingsMetric = defineMetric({
	name: "recommendation-servings",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		if (
			output.type !== "recommendations" ||
			testCase.expected?.expectedServings === undefined
		)
			return result(
				true,
				"No explicit serving assertion applies to this variant.",
			);
		return result(
			output.recommendations.every(
				({ servings }) => servings === testCase.expected?.expectedServings,
			),
			"Every recommendation must honor the explicit session serving count.",
		);
	},
});

export const recommendationInventoryMetric = defineMetric({
	name: "recommendation-inventory-honesty",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		if (output.type !== "recommendations")
			return result(
				true,
				"No structured requirement availability is claimed by this variant.",
			);
		const inventory = new Set(
			testCase.input.inventory.map(({ name }) => normalize(name)),
		);
		const missing = new Set(
			(testCase.expected?.explicitlyMissingIngredients ?? []).map(normalize),
		);
		const honest = output.recommendations.every(({ ingredients }) =>
			ingredients.every(({ name, status }) => {
				const key = normalize(name);
				if (status === "available" && !inventory.has(key)) return false;
				if (missing.has(key) && status === "available") return false;
				return true;
			}),
		);
		return result(
			honest,
			"Only inventory-listed ingredients may be marked available; explicitly absent ingredients cannot be available.",
		);
	},
});

export const recommendationEquipmentMetric = defineMetric({
	name: "recommendation-equipment-honesty",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		if (output.type !== "recommendations")
			return result(
				true,
				"No structured equipment availability is claimed by this variant.",
			);
		const equipment = new Set(testCase.input.kitchen.equipment.map(normalize));
		const unavailable = new Set(
			(testCase.expected?.explicitlyUnavailableEquipment ?? []).map(normalize),
		);
		const honest = output.recommendations.every((recommendation) =>
			recommendation.equipment.every(({ name, status }) => {
				const key = normalize(name);
				return (
					status !== "available" ||
					(equipment.has(key) && !unavailable.has(key))
				);
			}),
		);
		return result(
			honest,
			"Only listed kitchen equipment may be marked available.",
		);
	},
});

export const recommendationOptionalMetric = defineMetric({
	name: "recommendation-optional-separation",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output }) => {
		if (output.type !== "recommendations")
			return result(true, "No ingredient lists exist on this variant.");
		const separated = output.recommendations.every((recommendation) => {
			const required = new Set(
				recommendation.ingredients.map(({ name }) => normalize(name)),
			);
			return recommendation.optionalIngredients.every(
				({ name }) => !required.has(normalize(name)),
			);
		});
		return result(
			separated,
			"Optional ingredients must not be duplicated as required ingredients.",
		);
	},
});

export const recommendationMetrics = [
	recommendationSchemaMetric,
	recommendationVariantMetric,
	recommendationServingsMetric,
	recommendationInventoryMetric,
	recommendationEquipmentMetric,
	recommendationOptionalMetric,
] as const;
