import { z } from "zod";

import { PreCookingOutputSchema } from "./pre-cooking-output";

const IdSchema = z.string().trim().min(1);

export const ActiveCookingPauseReasonSchema = z.enum([
	"user-request",
	"missing-ingredient",
	"missing-equipment",
	"interruption",
	"other",
]);

export type ActiveCookingPauseReason = z.infer<
	typeof ActiveCookingPauseReasonSchema
>;

export const ActiveCookingChangeSchema = z.object({
	kind: z.enum(["ingredient", "equipment", "servings", "step", "other"]),
	description: z.string().trim().min(1),
	relatedStepId: IdSchema.optional(),
});

export type ActiveCookingChange = z.infer<typeof ActiveCookingChangeSchema>;

const ActiveCookingProgressSchema = z.object({
	currentStageId: IdSchema,
	currentStepId: IdSchema,
	completedStepIds: z.array(IdSchema),
	changes: z.array(ActiveCookingChangeSchema),
});

export const CompletedActiveCookingSessionSchema =
	ActiveCookingProgressSchema.extend({
		status: z.literal("completed"),
	});

export type CompletedActiveCookingSession = z.infer<
	typeof CompletedActiveCookingSessionSchema
>;

export const ActiveCookingSessionSchema = z.discriminatedUnion("status", [
	ActiveCookingProgressSchema.extend({
		status: z.literal("active"),
	}),
	ActiveCookingProgressSchema.extend({
		status: z.literal("paused"),
		pauseReason: ActiveCookingPauseReasonSchema,
	}),
	CompletedActiveCookingSessionSchema,
	ActiveCookingProgressSchema.extend({
		status: z.literal("abandoned"),
	}),
]);

export type ActiveCookingSession = z.infer<typeof ActiveCookingSessionSchema>;

export const ActiveCookingPlanSessionSchema = z
	.object({
		cookingPlan: PreCookingOutputSchema,
		session: ActiveCookingSessionSchema,
	})
	.superRefine(({ cookingPlan, session }, context) => {
		const stageIds = new Set<string>();
		const stepIds = new Set<string>();

		for (const step of cookingPlan.preparationSteps) {
			if (stepIds.has(step.id)) {
				context.addIssue({
					code: "custom",
					message: `Duplicate plan step ID: ${step.id}`,
					path: ["cookingPlan", "preparationSteps"],
				});
			}

			stepIds.add(step.id);
		}

		for (const stage of cookingPlan.cookingStages) {
			if (stageIds.has(stage.id)) {
				context.addIssue({
					code: "custom",
					message: `Duplicate cooking stage ID: ${stage.id}`,
					path: ["cookingPlan", "cookingStages"],
				});
			}

			stageIds.add(stage.id);

			for (const step of stage.steps) {
				if (stepIds.has(step.id)) {
					context.addIssue({
						code: "custom",
						message: `Duplicate plan step ID: ${step.id}`,
						path: ["cookingPlan", "cookingStages"],
					});
				}

				stepIds.add(step.id);
			}
		}

		const currentStage = cookingPlan.cookingStages.find(
			(stage) => stage.id === session.currentStageId,
		);

		if (!currentStage) {
			context.addIssue({
				code: "custom",
				message: "Current stage ID does not exist in the cooking plan",
				path: ["session", "currentStageId"],
			});
		} else if (
			!currentStage.steps.some((step) => step.id === session.currentStepId)
		) {
			context.addIssue({
				code: "custom",
				message: "Current step ID does not belong to the current cooking stage",
				path: ["session", "currentStepId"],
			});
		}

		const completedStepIds = new Set<string>();

		for (const [index, stepId] of session.completedStepIds.entries()) {
			if (!stepIds.has(stepId)) {
				context.addIssue({
					code: "custom",
					message: "Completed step ID does not exist in the cooking plan",
					path: ["session", "completedStepIds", index],
				});
			}

			if (completedStepIds.has(stepId)) {
				context.addIssue({
					code: "custom",
					message: "Completed step IDs must be unique",
					path: ["session", "completedStepIds", index],
				});
			}

			completedStepIds.add(stepId);
		}

		for (const [index, change] of session.changes.entries()) {
			if (change.relatedStepId && !stepIds.has(change.relatedStepId)) {
				context.addIssue({
					code: "custom",
					message: "Related step ID does not exist in the cooking plan",
					path: ["session", "changes", index, "relatedStepId"],
				});
			}
		}
	});

export const ActiveCookingInputSchema =
	ActiveCookingPlanSessionSchema.safeExtend({
		message: z.string().trim().min(1),
	});

export type ActiveCookingInput = z.infer<typeof ActiveCookingInputSchema>;
