import { expect, test } from "bun:test";
import type { InventoryItemResponse } from "@flemme/contracts/inventory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNavigation } from "@/components/app";
import { Dialog } from "@/components/ui/dialog";
import { InventoryEmpty } from "./inventory-empty";
import { InventoryError } from "./inventory-error";
import { InventoryForm } from "./inventory-form";
import { InventoryItem } from "./inventory-item";
import { InventoryLoading } from "./inventory-loading";

const resolved: InventoryItemResponse = {
	id: "6a0de40f-5777-41d4-a217-3a1c06e8f799",
	ingredientKey: "egg",
	name: "An intentionally very long ingredient name that must stay contained",
	quantity: 6,
	unit: "pcs",
	isApproximate: false,
	condition: "fresh",
};
const unresolved: InventoryItemResponse = {
	id: "65ca57f4-ab25-48a9-ad7a-a88ce2d5d22c",
	ingredientKey: null,
	name: "Daun Gedi",
	quantity: null,
	unit: null,
	isApproximate: false,
	condition: "unknown",
};

function renderWithQuery(component: React.ReactNode) {
	return renderToStaticMarkup(
		<QueryClientProvider client={new QueryClient()}>
			{component}
		</QueryClientProvider>,
	);
}

async function renderInventoryNavigation() {
	const rootRoute = createRootRoute({ component: BottomNavigation });
	const appRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app",
		component: () => null,
	});
	const inventoryRoute = createRoute({
		getParentRoute: () => appRoute,
		path: "inventory",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([appRoute.addChildren([inventoryRoute])]),
		history: createMemoryHistory({ initialEntries: ["/app/inventory"] }),
	});
	await router.load();
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("Inventory rows show names, optional quantities, resolution state, and actions", () => {
	const recognized = renderWithQuery(<InventoryItem item={resolved} />);
	const unknown = renderWithQuery(<InventoryItem item={unresolved} />);

	expect(recognized).toContain("intentionally very long ingredient name");
	expect(recognized).toContain("6 pcs");
	expect(recognized).not.toContain("Not recognized yet");
	expect(recognized).toContain("Options for An intentionally");
	expect(unknown).toContain("Daun Gedi");
	expect(unknown).toContain("Quantity not set");
	expect(unknown).toContain("Not recognized yet");
});

test("Inventory form asks only for name and optional quantity details", () => {
	const add = renderToStaticMarkup(
		<Dialog open>
			<InventoryForm isPending={false} onSubmit={async () => true} />
		</Dialog>,
	);
	const edit = renderToStaticMarkup(
		<Dialog open>
			<InventoryForm
				item={unresolved}
				isPending={true}
				errorMessage="Controlled inventory error"
				onSubmit={async () => false}
			/>
		</Dialog>,
	);

	expect(add).toContain("Ingredient name");
	expect(add).toContain("Quantity");
	expect(add).toContain("Unit");
	expect(add).toContain("Add ingredient");
	expect(edit).toContain("Daun Gedi");
	expect(edit).toContain("Saving…");
	expect(edit).toContain("Controlled inventory error");
	expect(edit).not.toContain("ingredientKey");
});

test("Inventory loading, error, and empty states stay focused and actionable", () => {
	const loading = renderToStaticMarkup(<InventoryLoading />);
	const error = renderToStaticMarkup(
		<InventoryError onRetry={() => undefined} />,
	);
	const empty = renderToStaticMarkup(
		<InventoryEmpty onAdd={() => undefined} />,
	);

	expect(loading).toContain("Loading inventory");
	expect(error).toContain("Couldn&#x27;t load your inventory");
	expect(error).not.toContain("backend");
	expect(empty).toContain("Your inventory is empty");
	expect(empty).toContain("Add ingredient");
});

test("global Bottom Navigation stays visible with Inventory active", async () => {
	const markup = await renderInventoryNavigation();

	expect(markup).toContain("Primary navigation");
	expect(markup).toContain('href="/app/inventory"');
	expect(markup).toContain('aria-current="page"');
	expect(markup).toContain("Inventory");
});
