import { expect, test } from "bun:test";
import type { FavoriteResponse } from "@flemme/contracts/favorite";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNavigation } from "@/components/app";
import { FavoriteCardView } from "./favorite-card";
import { FavoriteEmpty } from "./favorite-empty";
import { FavoriteError } from "./favorite-error";
import { FavoriteLoading } from "./favorite-loading";

const favorite: FavoriteResponse = {
	id: "0ca519d2-47f0-49af-b0f8-af727bc60ab3",
	cookingSessionId: "8c6c976d-0698-4a43-93e8-0fa776654881",
	createdAt: "2026-09-17T21:00:00.000Z",
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
	recipe: {
		name: "Historical dish name",
		description: "The persisted recipe snapshot",
		servings: 2,
		estimatedDuration: { minMinutes: 20, maxMinutes: 30 },
	},
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

async function renderFavoritesNavigation() {
	const rootRoute = createRootRoute({ component: BottomNavigation });
	const appRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app",
		component: () => null,
	});
	const favoritesRoute = createRoute({
		getParentRoute: () => appRoute,
		path: "favorites",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([appRoute.addChildren([favoritesRoute])]),
		history: createMemoryHistory({ initialEntries: ["/app/favorites"] }),
	});
	await router.load();
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("Favorite card renders the persisted display name, summary, Nutrition, and canonical route", async () => {
	const markup = await renderWithAppRoutes(
		<FavoriteCardView
			favorite={favorite}
			removeState={{ status: "idle" }}
			onRemove={() => undefined}
		/>,
	);

	expect(markup).toContain("intentionally very long custom meal name");
	expect(markup).not.toContain("Historical dish name");
	expect(markup).toContain("2026-09-17T20:42:00.000Z");
	expect(markup).toContain("Warm, savory, and ready to serve");
	expect(markup).toContain("~420 kcal · 18g protein");
	expect(markup).toContain("Saved favorite");
	expect(markup).toContain(
		`/app/cooking/${favorite.cookingSessionId}/completion`,
	);
	expect(markup).toContain("View meal");
	expect(markup).toContain("Options for Saturday&#x27;s intentionally");
});

test("Favorite Nutrition variants remain explicit and never invent zero values", async () => {
	const partial = await renderWithAppRoutes(
		<FavoriteCardView
			favorite={{
				...favorite,
				nutrition: {
					status: "partial",
					estimated: true,
					caloriesKcal: 300,
					proteinG: 12,
				},
			}}
			removeState={{ status: "idle" }}
			onRemove={() => undefined}
		/>,
	);
	const unavailable = await renderWithAppRoutes(
		<FavoriteCardView
			favorite={{
				...favorite,
				displayName: favorite.recipe.name,
				completionSummary: null,
				nutrition: { status: "unavailable" },
			}}
			removeState={{ status: "idle" }}
			onRemove={() => undefined}
		/>,
	);

	expect(partial).toContain("Partial · ~300 kcal · 12g protein");
	expect(unavailable).toContain("Historical dish name");
	expect(unavailable).toContain("Nutrition unavailable");
	expect(unavailable).not.toContain("0 kcal");
});

test("Favorite removal keeps the card stable for pending and retryable failures", async () => {
	const pending = await renderWithAppRoutes(
		<FavoriteCardView
			favorite={favorite}
			removeState={{ status: "pending" }}
			onRemove={() => undefined}
		/>,
	);
	const failed = await renderWithAppRoutes(
		<FavoriteCardView
			favorite={favorite}
			removeState={{
				status: "error",
				message: "Flemme couldn't remove this favorite. Try again.",
			}}
			onRemove={() => undefined}
		/>,
	);

	expect(pending).toContain("intentionally very long custom meal name");
	expect(pending).toContain("Removing favorite");
	expect(failed).toContain("intentionally very long custom meal name");
	expect(failed).toContain("Flemme couldn&#x27;t remove this favorite");
	expect(failed).toContain("Try removing again");
	expect(failed).toContain('role="alert"');
});

test("Favorites loading, error, and empty states remain focused and actionable", async () => {
	const loading = renderToStaticMarkup(<FavoriteLoading />);
	const error = renderToStaticMarkup(
		<FavoriteError onRetry={() => undefined} />,
	);
	const empty = await renderWithAppRoutes(<FavoriteEmpty />);

	expect(loading).toContain("Loading favorites");
	expect(error).toContain("Couldn&#x27;t load your favorites");
	expect(error).not.toContain("backend");
	expect(empty).toContain("No favorites yet");
	expect(empty).toContain("Start cooking");
	expect(empty).toContain('href="/app"');
});

test("global Bottom Navigation stays visible with Favorites active", async () => {
	const markup = await renderFavoritesNavigation();

	expect(markup).toContain("Primary navigation");
	expect(markup).toContain('href="/app/favorites"');
	expect(markup).toContain('aria-current="page"');
	expect(markup).toContain("Favorites");
});
