import type {
	ActiveCookingChange,
	CompletionOutput,
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import type { RecipeNutritionResult } from "@flemme/nutrition";
import { sql } from "drizzle-orm";
import {
	check,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

import { users } from "../auth/user";

export const cookingSessionPhaseEnum = pgEnum("cooking_session_phase", [
	"recommendation",
	"pre_cooking",
	"active_cooking",
	"completion",
]);

export const cookingSessionStatusEnum = pgEnum("cooking_session_status", [
	"active",
	"paused",
	"completed",
	"abandoned",
]);

export const cookingSessionPauseReasonEnum = pgEnum(
	"cooking_session_pause_reason",
	[
		"user-request",
		"missing-ingredient",
		"missing-equipment",
		"interruption",
		"other",
	],
);

export const cookingSessions = pgTable(
	"cooking_sessions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		phase: cookingSessionPhaseEnum("phase").notNull().default("recommendation"),
		status: cookingSessionStatusEnum("status").notNull().default("active"),
		pauseReason: cookingSessionPauseReasonEnum("pause_reason"),
		recommendationSnapshot: jsonb(
			"recommendation_snapshot",
		).$type<CookingRecommendationOutput>(),
		selectedRecipeSnapshot: jsonb(
			"selected_recipe_snapshot",
		).$type<CookingRecommendation>(),
		preCookingPlanSnapshot: jsonb(
			"pre_cooking_plan_snapshot",
		).$type<PreCookingOutput>(),
		currentStageId: text("current_stage_id"),
		currentStepId: text("current_step_id"),
		completedStepIds: text("completed_step_ids")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		changes: jsonb("changes")
			.$type<ActiveCookingChange[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		completionSnapshot: jsonb("completion_snapshot").$type<CompletionOutput>(),
		nutritionSnapshot:
			jsonb("nutrition_snapshot").$type<RecipeNutritionResult>(),
		startedAt: timestamp("started_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("cooking_sessions_id_user_id_unique").on(table.id, table.userId),
		index("cooking_sessions_user_status_updated_at_idx").on(
			table.userId,
			table.status,
			table.updatedAt,
		),
		check(
			"cooking_sessions_pause_reason_matches_status",
			sql`(${table.status} = 'paused' and ${table.pauseReason} is not null) or (${table.status} <> 'paused' and ${table.pauseReason} is null)`,
		),
		check(
			"cooking_sessions_selected_recipe_required_after_recommendation",
			sql`${table.phase} = 'recommendation' or ${table.selectedRecipeSnapshot} is not null`,
		),
		check(
			"cooking_sessions_plan_and_position_required_during_execution",
			sql`${table.phase} not in ('active_cooking', 'completion') or (${table.preCookingPlanSnapshot} is not null and ${table.currentStageId} is not null and ${table.currentStepId} is not null)`,
		),
		check(
			"cooking_sessions_completion_state",
			sql`(${table.status} = 'completed' and ${table.phase} = 'completion' and ${table.completedAt} is not null) or (${table.status} <> 'completed' and ${table.completedAt} is null)`,
		),
	],
);
