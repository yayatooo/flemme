import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";

/** Task-specific instructions for cooking recommendations. */
export function createCookingRecommendationPrompt(
	context: CookingRecommendationInput,
) {
	const structuredContext = JSON.stringify(context, null, 2);

	return `
Task: recommend meals that are personally relevant to this user's current cooking situation.

Use the supplied context as the basis for every recommendation.

${structuredContext}

Recommendation priorities:
1. Respect the user's explicit current-session request first.
2. Use ingredients that are currently available in the user's inventory.
3. Match the user's household needs and serving situation.
4. Match known food and taste preferences.
5. Respect available kitchen equipment.
6. Fit the available cooking time and cooking preferences.
7. Prefer meals that make practical use of ingredients that should be used soon,
   when that information is available.
8. Avoid recommending meals that conflict with known dislikes, restrictions,
   equipment limitations, or the user's current request.

Personalization:
- Recommendations should feel specific to this user, not like generic recipe ideas.
- Use known preferences and household context when they meaningfully affect the choice.
- Treat multiple cuisine or food references as separate preference signals, not as
  one fixed cuisine identity, quotas, or a requirement that every recommendation
  combine them.
- Rank recommendations across the preferences that are most relevant to the current
  context. Inventory fit, equipment fit, available cooking time, and practicality
  must still influence the ranking.
- A recommendation set may represent different cuisine directions when each option
  is meaningfully relevant to the user's context.
- Do not force a cuisine reference onto a recommendation when the current inventory
  is a poor match. A strong inventory match outside the user's preferred cuisines may
  still be offered honestly as a practical alternative or fallback.
- Do not mention profile information merely to prove that you know it.
- Do not mention or try to satisfy every stored preference in every recommendation.
- Do not invent personalization when a preference or profile detail was not provided.
- If the current-session request conflicts with a profile default, follow the
  current-session request for this recommendation.
- Keep personalization flexible and relevant rather than treating preferences as
  rigid requirements.
- Prefer meaningful relevance over trying to satisfy every available profile field.

Structured recommendation fields:
- Include only ingredients necessary for the proposed meal to remain feasible in
  ingredients.
- If an ingredient is described as optional, suggested, enhancing, nice-to-have,
  or nonessential in any way, never include it in ingredients. Place it only in
  optionalIngredients.
- Include only equipment required for the proposed cooking method in equipment.
  Do not include equipment merely because it is available or optionally useful.
- Use available only when the ingredient or equipment is explicitly present in
  the supplied context. Available does not guarantee that an unknown quantity is
  sufficient.
- When an ingredient is present but its quantity may be insufficient, keep its
  status as available, state the recipe requirement in requiredAmount, add a
  required confirmation when the quantity materially affects feasibility, and
  use needs_confirmation when needed.
- Use missing only when a required item is explicitly unavailable from the current
  context.
- Never move an optional ingredient into missing requirements.

For each recommendation:
- Give the meal name.
- Briefly explain why it fits this user's current situation.
- Identify ingredient availability or meaningful uncertainty.
- Identify any important constraint or missing requirement.
- Keep the recommendation at discovery level.
- Do not provide the full cooking procedure yet.

Do not ask a follow-up question unless the missing information materially changes
whether a useful recommendation can be made.
`.trim();
}
