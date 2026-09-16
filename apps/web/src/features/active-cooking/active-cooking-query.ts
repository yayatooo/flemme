import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { cookingSessionReadErrorMessage } from "@/features/cooking-session/cooking-session-query";

export interface ResolvedCookingPosition {
	stage: CookingSessionResponse["cookingPlan"]["cookingStages"][number];
	step: CookingSessionResponse["cookingPlan"]["cookingStages"][number]["steps"][number];
	stageIndex: number;
	stepIndex: number;
	totalStages: number;
	overallStepIndex: number;
	totalSteps: number;
	previous: { stageId: string; stepId: string } | undefined;
	next: { stageId: string; stepId: string } | undefined;
	isFinalStep: boolean;
	isCompletionBoundaryReached: boolean;
}

export type CookingPositionResult =
	| { ok: true; position: ResolvedCookingPosition }
	| { ok: false; message: string };

export function resolveCookingPosition(
	persisted: CookingSessionResponse,
): CookingPositionResult {
	const stages = persisted.cookingPlan.cookingStages;
	const stageIndex = stages.findIndex(
		(stage) => stage.id === persisted.session.currentStageId,
	);
	if (stageIndex < 0) {
		return {
			ok: false,
			message: "The saved cooking stage no longer matches this plan.",
		};
	}

	const stage = stages[stageIndex];
	if (!stage) {
		return { ok: false, message: "The saved cooking stage is unavailable." };
	}
	const stepIndex = stage.steps.findIndex(
		(step) => step.id === persisted.session.currentStepId,
	);
	if (stepIndex < 0) {
		return {
			ok: false,
			message: "The saved cooking step no longer matches this stage.",
		};
	}

	const step = stage.steps[stepIndex];
	if (!step) {
		return { ok: false, message: "The saved cooking step is unavailable." };
	}

	let totalSteps = 0;
	let overallStepIndex = stepIndex;
	for (const [index, planStage] of stages.entries()) {
		totalSteps += planStage.steps.length;
		if (index < stageIndex) overallStepIndex += planStage.steps.length;
	}

	const previousStep = stage.steps[stepIndex - 1];
	const previousStage = stages[stageIndex - 1];
	const previousStageStep = previousStage?.steps.at(-1);
	const previous = previousStep
		? { stageId: stage.id, stepId: previousStep.id }
		: previousStage && previousStageStep
			? { stageId: previousStage.id, stepId: previousStageStep.id }
			: undefined;

	const nextStep = stage.steps[stepIndex + 1];
	const nextStage = stages[stageIndex + 1];
	const next = nextStep
		? { stageId: stage.id, stepId: nextStep.id }
		: nextStage?.steps[0]
			? { stageId: nextStage.id, stepId: nextStage.steps[0].id }
			: undefined;
	const isFinalStep = next === undefined;

	return {
		ok: true,
		position: {
			stage,
			step,
			stageIndex,
			stepIndex,
			totalStages: stages.length,
			overallStepIndex,
			totalSteps,
			previous,
			next,
			isFinalStep,
			isCompletionBoundaryReached:
				isFinalStep && persisted.session.completedStepIds.includes(step.id),
		},
	};
}

export { cookingSessionReadErrorMessage as activeCookingReadErrorMessage };
