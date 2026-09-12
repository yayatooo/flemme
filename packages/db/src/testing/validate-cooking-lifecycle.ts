import type {
	CompletionOutput,
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import type { RecipeNutritionResult } from "@flemme/nutrition";
import { and, eq } from "drizzle-orm";

import { createDatabase } from "../client";
import {
	cookingSessions,
	favorites,
	households,
	inventories,
	inventoryItems,
	kitchens,
	userProfiles,
	users,
} from "../schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing");
}

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
	await db.insert(kitchens).values({ userId: user.id });
	const [inventory] = await db
		.insert(inventories)
		.values({ userId: user.id })
		.returning();
	assert(inventory, "Inventory creation failed");
	await db.insert(inventoryItems).values({
		inventoryId: inventory.id,
		ingredientKey: "salt",
		quantity: 100,
		unit: "g",
		condition: "fresh",
	});

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
