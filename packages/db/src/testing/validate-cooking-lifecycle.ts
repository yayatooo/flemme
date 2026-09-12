import {
	CompletedActiveCookingSessionSchema,
	CompletionInputSchema,
	type CompletionOutput,
	CompletionOutputSchema,
	type CookingRecommendation,
	type CookingRecommendationOutput,
	CookingRecommendationOutputSchema,
	CookingRecommendationSchema,
	type PreCookingOutput,
	PreCookingOutputSchema,
} from "@flemme/agent";
import { createIngredientCatalog } from "@flemme/ingredients";
import {
	type RecipeNutritionResult,
	RecipeNutritionResultSchema,
} from "@flemme/nutrition";
import { and, eq } from "drizzle-orm";

import { createDatabase } from "../client";
import {
	cookingSessions,
	favorites,
	households,
	inventories,
	inventoryItems,
	kitchenEquipment,
	kitchens,
	userProfiles,
	users,
} from "../schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing");
}

const validationIngredientCatalog = createIngredientCatalog({
	ingredients: [
		{
			key: "salt",
			names: { id: "Garam", en: "Salt" },
			aliases: { id: [], en: [] },
		},
	],
});

const canonicalSalt = validationIngredientCatalog.getByKey("salt");

const selectedRecipe: CookingRecommendation = {
	name: "Lifecycle Test Dish",
	description: "Synthetic recipe snapshot for database validation.",
	reason: "Validates persistence without invoking the cooking agent.",
	estimatedDuration: { minMinutes: 10, maxMinutes: 15 },
	servings: 2,
	feasibility: "ready",
	ingredients: [
		{
			name: "Salt",
			status: "available",
			requiredAmount: "10 grams",
		},
	],
	equipment: [{ name: "stove", status: "available" }],
	preferenceMatches: [],
	requiredConfirmations: [],
	optionalIngredients: [],
	warnings: [],
};

const recommendationSnapshot: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [selectedRecipe],
};

const preCookingPlanSnapshot: PreCookingOutput = {
	preparationSummary: { overview: "Prepare the synthetic lifecycle dish." },
	ingredients: [{ name: "Salt", quantity: 10, unit: "g" }],
	equipment: [{ name: "stove", required: true }],
	preparationSteps: [{ id: "prepare-salt", instruction: "Measure the salt." }],
	cookingStages: [
		{
			id: "cook-dish",
			title: "Cook dish",
			steps: [
				{ id: "start-cooking", instruction: "Start cooking." },
				{ id: "finish-cooking", instruction: "Finish cooking." },
			],
		},
	],
};

const completionSnapshot: CompletionOutput = {
	reply: "The lifecycle test dish is complete.",
	summary: {
		title: "Lifecycle Test Dish",
		description: "The synthetic database lifecycle dish was completed.",
	},
	notes: [],
};

const nutritionSnapshot: RecipeNutritionResult = {
	status: "complete",
	estimated: true,
	servings: 2,
	total: { caloriesKcal: 20, proteinG: 2, carbsG: 2, fatG: 1 },
	perServing: { caloriesKcal: 10, proteinG: 1, carbsG: 1, fatG: 0.5 },
};

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

assert(canonicalSalt, "Canonical salt fixture could not be resolved");

const { client, db } = createDatabase(databaseUrl);
let testUserId: string | undefined;

try {
	const email = `lifecycle-${crypto.randomUUID()}@flemme.local`;
	const [user] = await db.insert(users).values({ email }).returning();
	assert(user, "User creation failed");
	testUserId = user.id;

	await db.insert(userProfiles).values({
		userId: user.id,
		displayName: "Lifecycle Test User",
		foodPreferences: ["synthetic preference"],
		cookingPreferences: ["synthetic cooking preference"],
	});
	await db
		.insert(households)
		.values({ userId: user.id, adults: 2, children: 0, toddlers: 0 });
	const [kitchen] = await db
		.insert(kitchens)
		.values({ userId: user.id })
		.returning();
	assert(kitchen, "Kitchen creation failed");
	await db.insert(kitchenEquipment).values({
		kitchenId: kitchen.id,
		name: "stove",
	});
	const [inventory] = await db
		.insert(inventories)
		.values({ userId: user.id })
		.returning();
	assert(inventory, "Inventory creation failed");
	await db.insert(inventoryItems).values({
		inventoryId: inventory.id,
		ingredientKey: canonicalSalt.key,
		quantity: 100,
		unit: "g",
		condition: "fresh",
	});
	const [storedInventoryItem] = await db
		.select({ ingredientKey: inventoryItems.ingredientKey })
		.from(inventoryItems)
		.where(eq(inventoryItems.inventoryId, inventory.id));
	assert(
		storedInventoryItem?.ingredientKey === canonicalSalt.key,
		"Inventory item did not preserve its canonical ingredient key",
	);

	const [session] = await db
		.insert(cookingSessions)
		.values({
			userId: user.id,
			phase: "pre_cooking",
			status: "active",
			recommendationSnapshot,
			selectedRecipeSnapshot: selectedRecipe,
			preCookingPlanSnapshot,
		})
		.returning();
	assert(session, "Cooking session creation failed");

	await db
		.update(cookingSessions)
		.set({
			phase: "active_cooking",
			currentStageId: "cook-dish",
			currentStepId: "start-cooking",
			completedStepIds: ["prepare-salt"],
			updatedAt: new Date(),
		})
		.where(eq(cookingSessions.id, session.id));

	await db
		.update(cookingSessions)
		.set({
			currentStepId: "finish-cooking",
			completedStepIds: ["prepare-salt", "start-cooking"],
			changes: [
				{
					kind: "ingredient",
					description: "Synthetic salt adjustment recorded.",
					relatedStepId: "finish-cooking",
				},
			],
			updatedAt: new Date(),
		})
		.where(eq(cookingSessions.id, session.id));

	const completedAt = new Date();
	await db
		.update(cookingSessions)
		.set({
			phase: "completion",
			status: "completed",
			completedStepIds: ["prepare-salt", "start-cooking", "finish-cooking"],
			completionSnapshot,
			nutritionSnapshot,
			completedAt,
			updatedAt: completedAt,
		})
		.where(eq(cookingSessions.id, session.id));

	const completedHistory = await db
		.select()
		.from(cookingSessions)
		.where(
			and(
				eq(cookingSessions.userId, user.id),
				eq(cookingSessions.status, "completed"),
			),
		);
	assert(
		completedHistory.length === 1,
		"Completed session history query failed",
	);
	assert(
		completedHistory[0]?.currentStepId === "finish-cooking",
		"Completed progress was not preserved",
	);
	assert(
		completedHistory[0]?.preCookingPlanSnapshot?.cookingStages[0]?.id ===
			"cook-dish",
		"Cooking plan snapshot was not preserved",
	);

	const restoredSession = completedHistory[0];
	assert(restoredSession, "Completed cooking session could not be restored");
	const restoredRecommendation = CookingRecommendationOutputSchema.parse(
		restoredSession.recommendationSnapshot,
	);
	const restoredSelectedRecipe = CookingRecommendationSchema.parse(
		restoredSession.selectedRecipeSnapshot,
	);
	const restoredPlan = PreCookingOutputSchema.parse(
		restoredSession.preCookingPlanSnapshot,
	);
	const restoredProgress = CompletedActiveCookingSessionSchema.parse({
		status: restoredSession.status,
		currentStageId: restoredSession.currentStageId,
		currentStepId: restoredSession.currentStepId,
		completedStepIds: restoredSession.completedStepIds,
		changes: restoredSession.changes,
	});
	const restoredCompletion = CompletionOutputSchema.parse(
		restoredSession.completionSnapshot,
	);
	const restoredNutrition = RecipeNutritionResultSchema.parse(
		restoredSession.nutritionSnapshot,
	);

	CompletionInputSchema.parse({
		cookingPlan: restoredPlan,
		session: restoredProgress,
	});
	assert(
		restoredRecommendation.type === "recommendations" &&
			restoredRecommendation.recommendations[0]?.name ===
				restoredSelectedRecipe.name,
		"Recommendation and selected recipe snapshots do not agree",
	);
	assert(
		restoredCompletion.summary.title === restoredSelectedRecipe.name,
		"Completion snapshot does not describe the selected recipe",
	);
	assert(
		restoredNutrition.status === "complete" &&
			restoredNutrition.servings === restoredSelectedRecipe.servings,
		"Nutrition snapshot does not preserve the selected serving count",
	);

	await db.insert(favorites).values({
		userId: user.id,
		cookingSessionId: session.id,
	});
	const userFavorites = await db
		.select()
		.from(favorites)
		.where(eq(favorites.userId, user.id));
	assert(userFavorites.length === 1, "Favorite creation failed");

	console.log("Cooking lifecycle database validation passed.");
} finally {
	if (testUserId) {
		await db.delete(users).where(eq(users.id, testUserId));
	}

	await client.end();
}
