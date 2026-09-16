import { expect, test } from "bun:test";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { cookingSessionFixture } from "@/features/cooking-session/cooking-session-test-fixture";
import { resolveCookingPosition } from "./active-cooking-query";

function sessionAt(
	stageId: string,
	stepId: string,
	completedStepIds: string[] = [],
): CookingSessionResponse {
	return {
		...cookingSessionFixture,
		session: {
			...cookingSessionFixture.session,
			currentStageId: stageId,
			currentStepId: stepId,
			completedStepIds,
		},
	};
}

test("resolves the current stage and step by stable IDs", () => {
	const result = resolveCookingPosition(
		sessionAt("cook-chicken", "coat-chicken", ["toast-garlic"]),
	);

	expect(result.ok).toBe(true);
	if (!result.ok) return;
	expect(result.position.stage.title).toBe("Cook the chicken");
	expect(result.position.step.instruction).toBe(
		"Coat the chicken in the sauce.",
	);
	expect(result.position.overallStepIndex).toBe(2);
	expect(result.position.isFinalStep).toBe(true);
	expect(result.position.isCompletionBoundaryReached).toBe(false);
});

test("completed-step count never chooses the current position", () => {
	const result = resolveCookingPosition(
		sessionAt("build-sauce", "toast-garlic", ["toast-garlic", "brown-chicken"]),
	);

	expect(result.ok).toBe(true);
	if (!result.ok) return;
	expect(result.position.stageIndex).toBe(0);
	expect(result.position.stepIndex).toBe(0);
});

test("resolves previous and next across a stage boundary without wrapping", () => {
	const first = resolveCookingPosition(cookingSessionFixture);
	const secondStage = resolveCookingPosition(
		sessionAt("cook-chicken", "brown-chicken"),
	);

	expect(first.ok && first.position.previous).toBeUndefined();
	expect(first.ok && first.position.next).toEqual({
		stageId: "cook-chicken",
		stepId: "brown-chicken",
	});
	expect(secondStage.ok && secondStage.position.previous).toEqual({
		stageId: "build-sauce",
		stepId: "toast-garlic",
	});
});

test("invalid persisted stage and step IDs return controlled errors", () => {
	const invalidStage = resolveCookingPosition(
		sessionAt("missing-stage", "toast-garlic"),
	);
	const invalidStep = resolveCookingPosition(
		sessionAt("build-sauce", "missing-step"),
	);

	expect(invalidStage).toEqual({
		ok: false,
		message: "The saved cooking stage no longer matches this plan.",
	});
	expect(invalidStep).toEqual({
		ok: false,
		message: "The saved cooking step no longer matches this stage.",
	});
});

test("the final recorded step reaches the completion boundary", () => {
	const result = resolveCookingPosition(
		sessionAt("cook-chicken", "coat-chicken", [
			"toast-garlic",
			"brown-chicken",
			"coat-chicken",
		]),
	);

	expect(result.ok && result.position.isCompletionBoundaryReached).toBe(true);
});
