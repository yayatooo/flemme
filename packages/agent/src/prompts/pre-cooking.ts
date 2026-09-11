import type { PreCookingInput } from "../schemas/pre-cooking-input";

/** Minimal task-specific instructions for the pre-cooking phase. */
export function createPreCookingPrompt({
	selectedRecipe,
	context,
}: PreCookingInput) {
	return `
Task: convert the recipe the user has already selected and the current cooking
context into one complete, executable cooking plan.

The selected recipe is fixed for this task. Do not recommend or substitute
another recipe, change its core cooking concept, remove required ingredients,
or add unrelated ingredients. Preserve known recipe quantities. Only make an
adaptation when explicit context requires it and the adaptation remains faithful
to the selected recipe.

Generate the entire plan in one response: preparationSummary, ingredients,
equipment, preparationSteps, and all cookingStages with their steps. The plan
must be complete enough for a user to follow later without generating each step
again. Do not start active cooking or imply that preparation or cooking progress
has already occurred.

Plan semantics:
- Keep preparationSummary concise and use optional time estimates only when they
  can be reasonably inferred. Omit a time instead of fabricating precision.
- ingredients describes what the recipe requires, not preparation actions.
  Preserve a known quantity and unit. When they are unknown or unnecessary,
  include only the ingredient name rather than inventing an amount.
- equipment describes what is required to execute this plan. Respect the supplied
  kitchen context, prefer faithful adaptations using available equipment, and do
  not invent equipment availability.
- preparationSteps contains ordered, practical actions performed before the
  active cooking process, such as washing, cutting, measuring, mixing, arranging
  ingredients, or preparing tools.
- cookingStages groups the complete cooking process into meaningful phases. Each
  stage must contain ordered, atomic steps that are understandable without
  another model generation.
- Treat actions involving active heat or the primary cooking process, such as
  heating, boiling, frying, sauteing, simmering, baking, steaming, or reducing,
  as cooking steps rather than preparation steps.
- Do not include progress, navigation, completion, chat, or conditional-response
  state in the plan.

Selected recipe:
${JSON.stringify(selectedRecipe, null, 2)}

Current cooking context:
${JSON.stringify(context, null, 2)}
`.trim();
}
