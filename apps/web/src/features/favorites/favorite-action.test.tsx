import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FavoriteActionView } from "./favorite-action";

const noop = () => {};

test("eligible completed session exposes the one-tap save action", () => {
	const markup = renderToStaticMarkup(
		<FavoriteActionView state={{ status: "available", onAction: noop }} />,
	);

	expect(markup).toContain("Save to favorites");
	expect(markup).not.toContain('disabled=""');
});

test("pending state disables duplicate save while Nutrition stays in place", () => {
	const markup = renderToStaticMarkup(
		<FavoriteActionView state={{ status: "saving" }} />,
	);

	expect(markup).toContain("Saving...");
	expect(markup).toContain('disabled=""');
	expect(markup).toContain('aria-live="polite"');
});

test("persisted state renders a compact disabled saved action", () => {
	const markup = renderToStaticMarkup(
		<FavoriteActionView state={{ status: "saved" }} />,
	);

	expect(markup).toContain("Favorite saved");
	expect(markup).toContain("Saved to favorites");
	expect(markup).toContain("Saved");
	expect(markup).toContain('disabled=""');
	expect(markup).toContain('fill="currentColor"');
});

test("real save error shows controlled copy and an accessible retry", () => {
	const markup = renderToStaticMarkup(
		<FavoriteActionView
			state={{
				status: "save-error",
				message: "Your completed meal and Nutrition review are safe.",
				onAction: noop,
			}}
		/>,
	);

	expect(markup).toContain('role="alert"');
	expect(markup).toContain("Try saving again");
	expect(markup).toContain(
		"Your completed meal and Nutrition review are safe.",
	);
});
