import { expect, test } from "bun:test";
import { getUserDisplayName, getUserInitial } from "./user-display-name";

test("uses a name before the email username", () => {
	const user = { name: "  Tiara Putri  ", email: "other@example.com" };
	expect(getUserDisplayName(user)).toBe("Tiara Putri");
	expect(getUserInitial(user)).toBe("T");
});

test("falls back to a readable email username without exposing the email", () => {
	const user = { email: "rahmat@example.com" };
	expect(getUserDisplayName(user)).toBe("Rahmat");
	expect(getUserInitial(user)).toBe("R");
});

test("uses User when authenticated identity text is unavailable", () => {
	expect(getUserDisplayName(null)).toBe("User");
	expect(getUserInitial({ email: "" })).toBe("U");
});
