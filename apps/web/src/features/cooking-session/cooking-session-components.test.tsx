import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { CookingSessionPage } from "./cooking-session-page";
import { cookingSessionQueryKey } from "./cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "./cooking-session-test-fixture";
import { CreateCookingSessionAction } from "./create-cooking-session";

test("pending Start Cooking remains readable and disabled", () => {
	const markup = renderToStaticMarkup(
		<CreateCookingSessionAction
			isPending
			isCreated={false}
			disabled={false}
			onStart={() => undefined}
		/>,
	);
	expect(markup).toContain("Starting cooking");
	expect(markup).toContain("disabled");
});

test("creation failure exposes a keyboard button retry without hiding the error", () => {
	const markup = renderToStaticMarkup(
		<CreateCookingSessionAction
			isPending={false}
			isCreated={false}
			disabled={false}
			errorMessage="Couldn't start your cooking session. Your plan is still here."
			onStart={() => undefined}
		/>,
	);
	expect(markup).toContain("Try again");
	expect(markup).toContain('role="alert"');
	expect(markup).toContain("Your plan is still here");
});

test("persisted route boundary renders server session data", () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(
		cookingSessionQueryKey(cookingSessionId),
		cookingSessionFixture,
	);
	const markup = renderToStaticMarkup(
		<QueryClientProvider client={queryClient}>
			<CookingSessionPage sessionId={cookingSessionId} />
		</QueryClientProvider>,
	);
	expect(markup).toContain("Cooking session created");
	expect(markup).toContain(cookingSessionFixture.selectedRecipeSnapshot.name);
	expect(markup).toContain(cookingSessionId);
	expect(markup).not.toContain("Next step");
	expect(markup).not.toContain("Complete cooking");
});

test("persisted route keeps cached session visible after a background read failure", () => {
	const queryClient = new QueryClient();
	const queryKey = cookingSessionQueryKey(cookingSessionId);
	queryClient.setQueryData(queryKey, cookingSessionFixture);
	const query = queryClient.getQueryCache().find({ queryKey });
	query?.setState({
		...query.state,
		error: new Error("network unavailable"),
		errorUpdatedAt: Date.now(),
		fetchStatus: "idle",
		status: "error",
	});

	const markup = renderToStaticMarkup(
		<QueryClientProvider client={queryClient}>
			<CookingSessionPage sessionId={cookingSessionId} />
		</QueryClientProvider>,
	);

	expect(markup).toContain("Cooking session created");
	expect(markup).toContain(cookingSessionFixture.selectedRecipeSnapshot.name);
	expect(markup).not.toContain("Couldn't load cooking session");
});
