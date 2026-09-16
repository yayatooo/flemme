import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { preCookingFixture } from "@/features/pre-cooking/pre-cooking-test-fixture";
import { ActiveCookingLoading } from "./active-cooking-loading";
import { CookingControls } from "./cooking-controls";
import { CurrentStepCard } from "./current-step-card";
import { ClosedSessionStatus, PausedSessionStatus } from "./session-status";
import { StageProgress } from "./stage-progress";

test("loading restores persisted state without rendering fake instructions", () => {
	const markup = renderToStaticMarkup(<ActiveCookingLoading />);
	expect(markup).toContain("Getting your cooking session ready");
	expect(markup).not.toContain("Cook the garlic gently");
});

test("current step keeps instruction, qualitative timing, and cue prominent", () => {
	const markup = renderToStaticMarkup(
		<CurrentStepCard
			step={preCookingFixture.cookingStages[0].steps[0]}
			stepNumber={1}
			totalSteps={3}
		/>,
	);

	expect(markup).toContain("Current step · 1 of 3");
	expect(markup).toContain("Cook the garlic gently.");
	expect(markup).toContain("Quick");
	expect(markup).toContain("Ready when");
	expect(markup).toContain("Until fragrant");
	expect(markup).not.toContain("minutes");
});

test("stage progress describes structure rather than remaining time", () => {
	const markup = renderToStaticMarkup(
		<StageProgress
			stageTitle="Cook the chicken"
			stageIndex={1}
			totalStages={4}
		/>,
	);

	expect(markup).toContain("Stage 2 of 4");
	expect(markup).toContain("Cook the chicken");
	expect(markup).toContain('aria-valuenow="2"');
	expect(markup).not.toContain("remaining");
});

test("first-step Previous is disabled and final action says Finish cooking", () => {
	const markup = renderToStaticMarkup(
		<CookingControls
			canGoPrevious={false}
			isFinalStep
			isPending={false}
			onPrevious={() => undefined}
			onAdvance={() => undefined}
		/>,
	);

	expect(markup).toContain("Previous");
	expect(markup).toMatch(/disabled=""[^>]*>.*Previous/s);
	expect(markup).toContain("Finish cooking");
	expect(markup).not.toContain("Next step");
});

test("paused session exposes Resume and no step progression controls", () => {
	const markup = renderToStaticMarkup(
		<PausedSessionStatus
			pauseReason="missing-ingredient"
			isPending={false}
			onResume={() => undefined}
		/>,
	);

	expect(markup).toContain("Cooking paused");
	expect(markup).toContain("Buying a missing ingredient");
	expect(markup).toContain("Resume cooking");
	expect(markup).not.toContain("Next step");
});

test("completion boundary and closed lifecycle states do not render controls", () => {
	for (const [state, title] of [
		["boundary", "All cooking steps complete"],
		["completed", "Cooking completed"],
		["abandoned", "Cooking session abandoned"],
	] as const) {
		const markup = renderToStaticMarkup(<ClosedSessionStatus state={state} />);
		expect(markup).toContain(title);
		expect(markup).not.toContain("Next step");
		expect(markup).not.toContain("Resume cooking");
	}
});
