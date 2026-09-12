import { z } from "zod";

import {
	ActiveCookingChangeSchema,
	ActiveCookingPauseReasonSchema,
} from "./active-cooking-input";

export const AdvanceActionSchema = z.object({
	type: z.literal("advance"),
});

export type AdvanceAction = z.infer<typeof AdvanceActionSchema>;

export const PreviousStepActionSchema = z.object({
	type: z.literal("previous-step"),
});

export type PreviousStepAction = z.infer<typeof PreviousStepActionSchema>;

export const PauseActionSchema = z.object({
	type: z.literal("pause"),
	reason: ActiveCookingPauseReasonSchema,
});

export type PauseAction = z.infer<typeof PauseActionSchema>;

export const ResumeActionSchema = z.object({
	type: z.literal("resume"),
});

export type ResumeAction = z.infer<typeof ResumeActionSchema>;

export const RecordChangeActionSchema = z.object({
	type: z.literal("record-change"),
	change: ActiveCookingChangeSchema,
});

export type RecordChangeAction = z.infer<typeof RecordChangeActionSchema>;

export const CompleteCookingActionSchema = z.object({
	type: z.literal("complete-cooking"),
});

export type CompleteCookingAction = z.infer<typeof CompleteCookingActionSchema>;

export const AbandonCookingActionSchema = z.object({
	type: z.literal("abandon-cooking"),
});

export type AbandonCookingAction = z.infer<typeof AbandonCookingActionSchema>;

export const ClarifyActionSchema = z.object({
	type: z.literal("clarify"),
});

export type ClarifyAction = z.infer<typeof ClarifyActionSchema>;

export const ActiveCookingActionSchema = z.discriminatedUnion("type", [
	AdvanceActionSchema,
	PreviousStepActionSchema,
	PauseActionSchema,
	ResumeActionSchema,
	RecordChangeActionSchema,
	CompleteCookingActionSchema,
	AbandonCookingActionSchema,
	ClarifyActionSchema,
]);

export type ActiveCookingAction = z.infer<typeof ActiveCookingActionSchema>;

const LIFECYCLE_ACTION_TYPES = new Set<ActiveCookingAction["type"]>([
	"pause",
	"resume",
	"complete-cooking",
	"abandon-cooking",
]);

const NAVIGATION_ACTION_TYPES = new Set<ActiveCookingAction["type"]>([
	"advance",
	"previous-step",
]);

export const ActiveCookingOutputSchema = z
	.object({
		reply: z.string().trim().min(1),
		actions: z.array(ActiveCookingActionSchema),
	})
	.superRefine(({ actions }, context) => {
		if (
			actions.some((action) => action.type === "clarify") &&
			actions.length > 1
		) {
			context.addIssue({
				code: "custom",
				message: "Clarify must be the only proposed action",
				path: ["actions"],
			});
		}

		const lifecycleActionCount = actions.filter((action) =>
			LIFECYCLE_ACTION_TYPES.has(action.type),
		).length;

		if (lifecycleActionCount > 1) {
			context.addIssue({
				code: "custom",
				message: "Lifecycle actions cannot be combined",
				path: ["actions"],
			});
		}

		const navigationActionCount = actions.filter((action) =>
			NAVIGATION_ACTION_TYPES.has(action.type),
		).length;

		if (navigationActionCount > 1) {
			context.addIssue({
				code: "custom",
				message: "Navigation actions cannot be combined",
				path: ["actions"],
			});
		}

		const actionTypes = new Set<ActiveCookingAction["type"]>();

		for (const [index, action] of actions.entries()) {
			if (action.type === "record-change") {
				continue;
			}

			if (actionTypes.has(action.type)) {
				context.addIssue({
					code: "custom",
					message: `Duplicate ${action.type} action`,
					path: ["actions", index],
				});
			}

			actionTypes.add(action.type);
		}
	});

export type ActiveCookingOutput = z.infer<typeof ActiveCookingOutputSchema>;
