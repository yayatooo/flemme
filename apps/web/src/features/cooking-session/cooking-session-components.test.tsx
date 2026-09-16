import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
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
