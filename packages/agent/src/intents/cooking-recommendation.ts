/** Boundary for the cooking recommendation intent. */
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";

export function createRecommendationPrompt(input: string) {
	return `
${COOKING_INSTRUCTIONS}

Current cooking request:

${input}

Recommend one practical meal.

Explain briefly:
- what the meal is
- why it fits the available ingredients
- why it fits the user's current cooking situation
`.trim();
}
