import { expect, test } from "bun:test";
import { readAuthEnvironment } from "./auth-environment";

test("auth configuration supports password-only operation", () => {
	const valid = {
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "http://localhost:3000",
		WEB_ORIGIN: "http://localhost:5173",
	};
	expect(readAuthEnvironment(valid)).toMatchObject({
		WEB_ORIGIN: valid.WEB_ORIGIN,
		GOOGLE_AUTH_ENABLED: false,
	});
	expect(
		readAuthEnvironment({
			...valid,
			GOOGLE_CLIENT_ID: "",
			GOOGLE_CLIENT_SECRET: "",
		}).GOOGLE_AUTH_ENABLED,
	).toBe(false);
});

test("auth configuration accepts fully configured Google authentication", () => {
	const configured = readAuthEnvironment({
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "https://flemme.example",
		WEB_ORIGIN: "https://flemme.example",
		GOOGLE_AUTH_ENABLED: "true",
		GOOGLE_CLIENT_ID: "test-client",
		GOOGLE_CLIENT_SECRET: "test-secret",
		NODE_ENV: "production",
	});
	expect(configured.GOOGLE_AUTH_ENABLED).toBe(true);
	expect(configured.GOOGLE_CLIENT_ID).toBe("test-client");
});

test("auth configuration rejects partial or enabled-without-credentials Google configuration", () => {
	const valid = {
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "http://localhost:3000",
		WEB_ORIGIN: "http://localhost:5173",
	};
	for (const input of [
		{ ...valid, GOOGLE_CLIENT_ID: "test-client" },
		{ ...valid, GOOGLE_CLIENT_SECRET: "test-secret" },
		{ ...valid, GOOGLE_AUTH_ENABLED: "true" },
	]) {
		expect(() => readAuthEnvironment(input)).toThrow(
			/GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET/,
		);
	}
});

test("auth configuration requires exact origins and production HTTPS", () => {
	const valid = {
		BETTER_AUTH_SECRET: crypto.randomUUID(),
		BETTER_AUTH_URL: "http://localhost:3000",
		WEB_ORIGIN: "http://localhost:5173",
	};
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
