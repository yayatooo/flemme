import { expect, test } from "bun:test";
import type { CookingHistoryItem } from "@flemme/contracts/cooking-history";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNavigation } from "@/components/app";
import { CookingHistoryCard } from "./cooking-history-card";
import { CookingHistoryEmpty } from "./cooking-history-empty";
import { CookingHistoryError } from "./cooking-history-error";
import { CookingHistoryLoading } from "./cooking-history-loading";

const item: CookingHistoryItem = {
	sessionId: "8c6c976d-0698-4a43-93e8-0fa776654881",
	displayName:
		"Saturday's intentionally very long custom meal name for the entire family",
	completedAt: "2026-09-17T20:42:00.000Z",
	completionSummary: {
		title: "Finished",
		description: "Warm, savory, and ready to serve without any regeneration.",
	},
	nutrition: {
		status: "complete",
		estimated: true,
		caloriesKcal: 420,
		proteinG: 18,
	},
	isFavorite: true,
};

async function renderWithAppRoutes(component: React.ReactNode) {
	const rootRoute = createRootRoute({ component: () => component });
	const appRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app",
		component: () => null,
	});
	const completionRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app/cooking/$sessionId/completion",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([appRoute, completionRoute]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

async function renderHistoryNavigation() {
	const rootRoute = createRootRoute({ component: BottomNavigation });
	const appRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app",
		component: () => null,
	});
	const historyRoute = createRoute({
		getParentRoute: () => appRoute,
		path: "history",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([appRoute.addChildren([historyRoute])]),
		history: createMemoryHistory({ initialEntries: ["/app/history"] }),
	});
	await router.load();
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("History card renders completed details, Nutrition, Favorite, and canonical route", async () => {
	const markup = await renderWithAppRoutes(<CookingHistoryCard item={item} />);

	expect(markup).toContain("intentionally very long custom meal name");
	expect(markup).toContain("2026-09-17T20:42:00.000Z");
	expect(markup).toContain("Warm, savory, and ready to serve");
	expect(markup).toContain("~420 kcal · 18g protein");
	expect(markup).toContain("Saved favorite");
	expect(markup).toContain(`/app/cooking/${item.sessionId}/completion`);
	expect(markup).toContain("View meal");
});

test("partial Nutrition is explicit and unavailable Nutrition never becomes fake zero", async () => {
	const partial = await renderWithAppRoutes(
		<CookingHistoryCard
			item={{
				...item,
				nutrition: {
					status: "partial",
					estimated: true,
					caloriesKcal: 300,
					proteinG: 12,
				},
				isFavorite: false,
			}}
		/>,
	);
	const unavailable = await renderWithAppRoutes(
		<CookingHistoryCard
			item={{ ...item, nutrition: { status: "unavailable" } }}
		/>,
	);

	expect(partial).toContain("Partial · ~300 kcal · 12g protein");
	expect(partial).not.toContain("Saved favorite");
	expect(unavailable).toContain("Nutrition unavailable");
	expect(unavailable).not.toContain("0 kcal");
});

test("History loading, error, and empty states remain focused and actionable", async () => {
	const loading = renderToStaticMarkup(<CookingHistoryLoading />);
	const error = renderToStaticMarkup(
		<CookingHistoryError onRetry={() => undefined} />,
	);
	const empty = await renderWithAppRoutes(<CookingHistoryEmpty />);

	expect(loading).toContain("Loading cooking history");
	expect(error).toContain("Couldn&#x27;t load your cooking history");
	expect(error).not.toContain("backend");
	expect(empty).toContain("No cooking history yet");
	expect(empty).toContain("Start cooking");
	expect(empty).toContain('href="/app"');
});

test("global Bottom Navigation stays visible with History active", async () => {
	const markup = await renderHistoryNavigation();

	expect(markup).toContain("Primary navigation");
	expect(markup).toContain('href="/app/history"');
	expect(markup).toContain('aria-current="page"');
	expect(markup).toContain("History");
});
