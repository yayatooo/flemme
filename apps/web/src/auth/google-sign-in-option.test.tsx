import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GoogleSignInOption } from "./google-sign-in-option";

test("Google sign-in is absent when the public provider flag is disabled", () => {
	const html = renderToStaticMarkup(
		<GoogleSignInOption enabled={false} disabled={false} onClick={() => {}} />,
	);
	expect(html).toBe("");
});

test("Google sign-in is visible when the public provider flag is enabled", () => {
	const html = renderToStaticMarkup(
		<GoogleSignInOption enabled disabled={false} onClick={() => {}} />,
	);
	expect(html).toContain("Continue with Google");
});
