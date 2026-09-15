import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CookingStagesPreview } from "./cooking-stages-preview";
import { EquipmentRequirements } from "./equipment-requirements";
import { IngredientRequirements } from "./ingredient-requirements";
import { PreCookingError } from "./pre-cooking-error";
import { PreCookingLoading } from "./pre-cooking-loading";
import { PreCookingSummary } from "./pre-cooking-summary";
import { preCookingFixture } from "./pre-cooking-test-fixture";
import { PreparationSteps } from "./preparation-steps";
import { TimingBadge } from "./timing-badge";

test("loading names the work without fake progress", () => {
	const markup = renderToStaticMarkup(<PreCookingLoading />);
	expect(markup).toContain("Preparing your cooking plan");
	expect(markup).not.toContain("%");
});

test("summary renders overview and available recipe-level times", () => {
	const markup = renderToStaticMarkup(
		<PreCookingSummary summary={preCookingFixture.preparationSummary} />,
	);
	expect(markup).toContain(preCookingFixture.preparationSummary.overview);
	expect(markup).toContain("Prep 12 min");
	expect(markup).toContain("Cook 24 min");
});

test("ingredients keep quantity optional and equipment stays separate", () => {
	const ingredientMarkup = renderToStaticMarkup(
		<IngredientRequirements ingredients={preCookingFixture.ingredients} />,
	);
	const equipmentMarkup = renderToStaticMarkup(
		<EquipmentRequirements equipment={preCookingFixture.equipment} />,
	);
	expect(ingredientMarkup).toContain("Chicken thigh");
	expect(ingredientMarkup).toContain("300 g");
	expect(ingredientMarkup).toContain("Salt");
	expect(ingredientMarkup).not.toContain("Salt undefined");
	expect(ingredientMarkup).not.toContain("Frying pan");
	expect(equipmentMarkup).toContain("Frying pan");
	expect(equipmentMarkup).toContain("Required");
	expect(equipmentMarkup).toContain("Optional");
});

test("preparation steps show order, qualitative timing, and practical cues", () => {
	const markup = renderToStaticMarkup(
		<PreparationSteps steps={preCookingFixture.preparationSteps} />,
	);
	expect(markup).toContain("Before you cook");
	expect(markup).toContain("Thinly slice the garlic.");
	expect(markup).toContain("Very quick");
	expect(markup).toContain("Keep the slices even");
	expect(markup).toContain("A little time");
	expect(markup).not.toContain("Done");
});

test("all qualitative timing levels map to user-facing wording", () => {
	const markup = renderToStaticMarkup(
		<div>
			<TimingBadge level="very-short" />
			<TimingBadge level="short" />
			<TimingBadge level="medium" />
			<TimingBadge level="long" />
		</div>,
	);
	for (const label of ["Very quick", "Quick", "A little time", "Takes time"]) {
		expect(markup).toContain(label);
	}
});

test("cooking stages start collapsed with titles and step counts", () => {
	const markup = renderToStaticMarkup(
		<CookingStagesPreview stages={preCookingFixture.cookingStages} />,
	);
	expect(markup).toContain("01");
	expect(markup).toContain("Build the sauce");
	expect(markup).toContain("1 step");
	expect(markup).toContain("02");
	expect(markup).toContain("Cook the chicken");
	expect(markup).toContain("2 steps");
	expect(markup).toContain('aria-expanded="false"');
	expect(markup).not.toContain("Cook the garlic gently.");
});

test("generation error offers retry and back actions", () => {
	const markup = renderToStaticMarkup(
		<PreCookingError
			message="Keep the selected recipe."
			onRetry={() => undefined}
			onBack={() => undefined}
		/>,
	);
	expect(markup).toContain("Keep the selected recipe.");
	expect(markup).toContain("Try again");
	expect(markup).toContain("Back to recommendations");
});
