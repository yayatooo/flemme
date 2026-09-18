import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { AppHeader, BottomNavigation } from "@/components/app";
import { CookingPreferencesSection } from "./cooking-preferences-section";
import { HouseholdSection } from "./household-section";
import { formatHouseholdSummary } from "./household-summary";
import { LogoutSection } from "./logout-section";
import { PersonalInformationSection } from "./personal-information-section";
import { ProfileError } from "./profile-error";
import { ProfileLoading } from "./profile-loading";

function renderWithQuery(component: React.ReactNode) {
	return renderToStaticMarkup(
		<QueryClientProvider client={new QueryClient()}>
			{component}
		</QueryClientProvider>,
	);
}

async function renderProfileNavigation() {
	const user = {
		id: "70d2589b-79d6-4a7d-a1c5-e4c4472bf228",
		email: "google.cook@example.com",
		name: "A very long Google Cook name that must remain contained",
		image: "https://example.com/provider-avatar.png",
	};
	const rootRoute = createRootRoute({
		component: () => (
			<>
				<AppHeader user={user} />
				<LogoutSection />
				<BottomNavigation />
			</>
		),
	});
	const appRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/app",
		component: () => null,
	});
	const profileRoute = createRoute({
		getParentRoute: () => appRoute,
		path: "profile",
		component: () => null,
	});
	const loginRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/login",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([
			appRoute.addChildren([profileRoute]),
			loginRoute,
		]),
		history: createMemoryHistory({ initialEntries: ["/app/profile"] }),
	});
	await router.load();
	return renderToStaticMarkup(
		<QueryClientProvider client={new QueryClient()}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
}

test("personal information shows normalized identity, provider image, and read-only email", () => {
	const markup = renderWithQuery(
		<PersonalInformationSection
			user={{
				id: "70d2589b-79d6-4a7d-a1c5-e4c4472bf228",
				email: "tiara@example.com",
				name: "Tiara Putri",
				image: "https://example.com/tiara.png",
			}}
		/>,
	);

	expect(markup).toContain("Tiara Putri");
	expect(markup).toContain("tiara@example.com");
	expect(markup).toContain("readOnly");
	expect(markup).toContain("Email changes are not available yet");
	expect(markup).not.toContain("providerId");
});

test("preferences and household expose saved context through edit actions", () => {
	const preferences = renderWithQuery(
		<CookingPreferencesSection
			profile={{
				foodPreferences: ["spicy", "indonesian"],
				cookingPreferences: ["one-pan"],
			}}
		/>,
	);
	const household = renderWithQuery(
		<HouseholdSection household={{ adults: 2, children: 1, toddlers: 0 }} />,
	);

	expect(preferences).toContain("Spicy");
	expect(preferences).toContain("Indonesian");
	expect(preferences).toContain("One-pan");
	expect(preferences).toContain("not hard filters");
	expect(preferences).toContain("Edit preferences");
	expect(household).toContain("2 adults · 1 child · 0 toddlers");
	expect(household).toContain("Edit household");
	expect(formatHouseholdSummary({ adults: 1, children: 2, toddlers: 1 })).toBe(
		"1 adult · 2 children · 1 toddler",
	);
});

test("profile loading and failure states remain visible and retryable", () => {
	const loading = renderToStaticMarkup(<ProfileLoading />);
	const error = renderToStaticMarkup(
		<ProfileError onRetry={() => undefined} />,
	);

	expect(loading).toContain("Loading profile");
	expect(error).toContain("Couldn&#x27;t load your profile");
	expect(error).toContain("Try again");
	expect(error).not.toContain("Database detail");
});

test("header opens Profile while account logout and four-item navigation remain visible", async () => {
	const markup = await renderProfileNavigation();

	expect(markup).toContain('href="/app/profile"');
	expect(markup).toContain("Log out");
	expect(markup).toContain("Primary navigation");
	expect(markup).toContain("grid-cols-4");
	expect(markup).not.toContain("Delete account");
});
