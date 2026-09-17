import { expect, test } from "bun:test";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "@/features/cooking-session/cooking-session-test-fixture";
import {
	ActiveSessionCard,
	ActiveSessionCardLoading,
	ActiveSessionError,
} from "./active-session-card";
import {
	type ActiveSessionSummary,
	createActiveSessionSummary,
} from "./active-session-summary";

async function renderActiveSessionCard(session: ActiveSessionSummary) {
	const rootRoute = createRootRoute({
		component: () => <ActiveSessionCard session={session} />,
	});
	const cookingRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app/cooking/$sessionId",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([cookingRoute]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	return renderToStaticMarkup(<RouterProvider router={router} />);
}
test("no resumable session omits the Continue Cooking section", () => {
	expect(renderToStaticMarkup(<ActiveSessionCard session={null} />)).toBe("");
});

test("active session presents persisted name, stage, step, status, and route", async () => {
	const summary = createActiveSessionSummary(cookingSessionFixture);
	expect(summary).not.toBeNull();
	if (!summary) throw new Error("Active fixture must resolve");
	const markup = await renderActiveSessionCard(summary);
	const stage = cookingSessionFixture.cookingPlan.cookingStages[0];
	const step = stage.steps[0];

	expect(summary.displayName).toBe(
		cookingSessionFixture.selectedRecipeSnapshot.name,
	);
	expect(markup).toContain("Continue Cooking");
	expect(markup).toContain("In progress");
	expect(markup).toContain(`Stage 1 · ${stage.title}`);
	expect(markup).toContain(`Current step · ${step.instruction}`);
	expect(markup).toContain(`/app/cooking/${cookingSessionId}`);
});

test("paused session preserves lifecycle state and custom display name", async () => {
	const paused = {
		...cookingSessionFixture,
		customName: "Saturday's very long family cooking session name",
		session: {
			...cookingSessionFixture.session,
			status: "paused" as const,
			pauseReason: "user-request" as const,
		},
	};
	const summary = createActiveSessionSummary(paused);
	expect(summary).not.toBeNull();
	if (!summary) throw new Error("Paused fixture must resolve");
	const markup = await renderActiveSessionCard(summary);

	expect(summary.status).toBe("paused");
	expect(markup).toContain("Paused");
	expect(summary.displayName).toBe(paused.customName);
	expect(markup).toContain("very long family cooking session name");
	expect(markup).toContain("Continue cooking");
	expect(markup).not.toContain("Resume cooking");
});

test("terminal or corrupt persisted progress never produces a misleading card", () => {
	const completed = {
		...cookingSessionFixture,
		phase: "completion" as const,
		session: {
			...cookingSessionFixture.session,
			status: "completed" as const,
		},
		completedAt: "2026-09-17T10:00:00.000Z",
	} satisfies CookingSessionResponse;
	const corrupt = {
		...cookingSessionFixture,
		session: {
			...cookingSessionFixture.session,
			currentStageId: "missing-stage",
			currentStepId: "missing-step",
		},
	} satisfies CookingSessionResponse;

	expect(createActiveSessionSummary(completed)).toBeNull();
	expect(createActiveSessionSummary(corrupt)).toBeNull();
});

test("loading and failure stay lightweight without blocking Home", () => {
	const loading = renderToStaticMarkup(<ActiveSessionCardLoading />);
	const error = renderToStaticMarkup(<ActiveSessionError />);

	expect(loading).toContain("Checking saved cooking session");
	expect(error).toContain("You can still start something new");
	expect(error).not.toContain("Try again");
});
