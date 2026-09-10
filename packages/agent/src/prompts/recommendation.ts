/** Task-specific instructions for cooking recommendations. */
export function createCookingRecommendationPrompt(context: string) {
	return `
Task: recommend meals that are personally relevant to this user's current cooking situation.

Use the supplied context as the basis for every recommendation.

${context}

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
- Do not mention profile information merely to prove that you know it.
- Do not invent personalization when a preference or profile detail was not provided.
- If the current-session request conflicts with a profile default, follow the
  current-session request for this recommendation.
- Prefer meaningful relevance over trying to satisfy every available profile field.

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
