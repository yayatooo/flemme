import { expect, test } from "bun:test";
import { readAuthEnvironment } from "./auth-environment";

test("auth configuration fails closed without exposing supplied secrets", () => {
	const valid = {
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "http://localhost:3000",
		WEB_ORIGIN: "http://localhost:5173",
		GOOGLE_CLIENT_ID: "a4-test-client",
		GOOGLE_CLIENT_SECRET: "a4-test-secret",
	};
	expect(readAuthEnvironment(valid).WEB_ORIGIN).toBe(valid.WEB_ORIGIN);
	for (const input of [
		{},
		{ ...valid, BETTER_AUTH_SECRET: "short" },
		{ ...valid, GOOGLE_CLIENT_ID: undefined },
		{ ...valid, GOOGLE_CLIENT_SECRET: "  " },
		{ ...valid, WEB_ORIGIN: "*" },
		{ ...valid, WEB_ORIGIN: "http://localhost:5173/path" },
		{ ...valid, NODE_ENV: "production" },
	])
		expect(() => readAuthEnvironment(input)).toThrow(
			"Invalid Auth configuration",
		);
});
