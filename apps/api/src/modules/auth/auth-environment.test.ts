import { expect, test } from "bun:test";
import { readAuthEnvironment } from "./auth-environment";

test("auth configuration requires credentials, exact origins and production HTTPS", () => {
	const valid = {
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "http://localhost:3000",
		WEB_ORIGIN: "http://localhost:5173",
		GOOGLE_CLIENT_ID: "a4-test-client",
		GOOGLE_CLIENT_SECRET: "a4-test-secret",
	};
	expect(readAuthEnvironment(valid).WEB_ORIGIN).toBe(valid.WEB_ORIGIN);
	expect(
		readAuthEnvironment({
			...valid,
			BETTER_AUTH_URL: "https://api.example.com",
			WEB_ORIGIN: "https://web.example.com",
			NODE_ENV: "production",
		}).WEB_ORIGIN,
	).toBe("https://web.example.com");
	for (const input of [
		{},
		{ ...valid, BETTER_AUTH_SECRET: "short" },
		{ ...valid, GOOGLE_CLIENT_ID: undefined },
		{ ...valid, GOOGLE_CLIENT_SECRET: "  " },
		{ ...valid, WEB_ORIGIN: "*" },
		{ ...valid, WEB_ORIGIN: "http://localhost:5173/path" },
		{ ...valid, NODE_ENV: "production" },
		{
			...valid,
			BETTER_AUTH_URL: "https://api.example.com",
			NODE_ENV: "production",
		},
		{
			...valid,
			WEB_ORIGIN: "https://web.example.com",
			NODE_ENV: "production",
		},
	])
		expect(() => readAuthEnvironment(input)).toThrow();
});
