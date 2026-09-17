import type { CookingRecommendationOutput } from "@flemme/agent/cooking-recommendation-output";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { preCookingFixture } from "@/features/pre-cooking/pre-cooking-test-fixture";
import { recommendationFixture } from "@/features/recommendation/recommendation-test-fixture";

export const cookingSessionId = "11111111-1111-4111-8111-111111111111";

export const recommendationSnapshot = {
	type: "recommendations",
	recommendations: [recommendationFixture],
} satisfies Extract<CookingRecommendationOutput, { type: "recommendations" }>;

export const cookingSessionFixture = {
	id: cookingSessionId,
	customName: null,
	phase: "active_cooking",
	session: {
		status: "active",
		currentStageId: preCookingFixture.cookingStages[0].id,
		currentStepId: preCookingFixture.cookingStages[0].steps[0].id,
		completedStepIds: [],
		changes: [],
	},
	recommendationSnapshot,
	selectedRecipeSnapshot: recommendationFixture,
	cookingPlan: preCookingFixture,
	completionSnapshot: null,
	nutritionSnapshot: null,
	startedAt: "2026-09-15T10:00:00.000Z",
	completedAt: null,
	createdAt: "2026-09-15T10:00:00.000Z",
	updatedAt: "2026-09-15T10:00:00.000Z",
} as const satisfies CookingSessionResponse;
