import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RecommendationClarification } from "./recommendation-clarification";
import { RecommendationNoViable } from "./recommendation-empty";
import { RecommendationList } from "./recommendation-list";
import { RecommendationLoading } from "./recommendation-loading";
import {
	recommendationFixture,
	recommendationFixtures,
} from "./recommendation-test-fixture";

test("Recommendation loading explains the pending work", () => {
	const markup = renderToStaticMarkup(<RecommendationLoading />);
	expect(markup).toContain("Finding something that fits");
	expect(markup).not.toContain("%");
});

test("one recommendation exposes a compact decision summary", () => {
	const markup = renderToStaticMarkup(
		<RecommendationList
			recommendations={[recommendationFixture]}
			onSelect={() => undefined}
		/>,
	);
	expect(markup).toContain("Needs a quick check");
	expect(markup).toContain("Ayam Kecap Sayur");
	expect(markup).toContain(recommendationFixture.reason);
	expect(markup).toContain("25–35 min");
	expect(markup).toContain("3 servings");
	expect(markup).toContain("1 quick check");
	expect(markup).toContain("1 missing");
	expect(markup).toContain("2 available");
	expect(markup).toContain("All ready");
	expect(markup).toContain("Select recipe");
});

test("confirmation stays visible while recipe details stay collapsed", () => {
	const markup = renderToStaticMarkup(
		<RecommendationList
			recommendations={[recommendationFixture]}
			onSelect={() => undefined}
		/>,
	);
	expect(markup).toContain(recommendationFixture.requiredConfirmations[0]);
	expect(markup).toContain('aria-expanded="false"');
	expect(markup).not.toContain("Spring onion");
	expect(markup).not.toContain("Fried shallots");
});

test("three recommendations render as one vertical comparison list", () => {
	const markup = renderToStaticMarkup(
		<RecommendationList
			recommendations={recommendationFixtures}
			onSelect={() => undefined}
		/>,
	);
	for (const recommendation of recommendationFixtures) {
		expect(markup).toContain(recommendation.name);
	}
});

test("clarification renders only the question returned by Recommendation", () => {
	const markup = renderToStaticMarkup(
		<RecommendationClarification
			question="How much time do you have?"
			reason="Time changes the available recipes."
			onAnswer={() => undefined}
		/>,
	);
	expect(markup).toContain("How much time do you have?");
	expect(markup).toContain("Update recommendations");
});

test("no viable renders as a distinct adjustable domain result", () => {
	const markup = renderToStaticMarkup(
		<RecommendationNoViable
			reason="No recipe fits the current request."
			constraints={["An oven is required."]}
			onAdjustRequest={() => undefined}
			onCheckInventory={() => undefined}
		/>,
	);
	expect(markup).toContain("No good match yet");
	expect(markup).toContain("Adjust request");
	expect(markup).not.toContain("Something went wrong");
});
