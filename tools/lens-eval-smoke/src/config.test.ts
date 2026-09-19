import assert from "node:assert/strict";
import { test } from "node:test";
import {
	LensSmokeConfigurationError,
	resolveLensSmokeConfig,
} from "./config.ts";

const validEnvironment = {
	ANVIA_LENS_BASE_URL: "http://127.0.0.1:18080",
	ANVIA_LENS_PUBLIC_KEY: "public-test-value",
	ANVIA_LENS_SECRET_KEY: "secret-test-value",
	ANVIA_LENS_SERVICE_NAME: "flemme-agent",
	ANVIA_LENS_ENVIRONMENT: "local",
};

test("accepts the complete loopback-only smoke configuration", () => {
	assert.deepEqual(resolveLensSmokeConfig(validEnvironment), {
		baseUrl: "http://127.0.0.1:18080",
		publicKey: "public-test-value",
		secretKey: "secret-test-value",
		serviceName: "flemme-agent",
		environment: "local",
	});
});

test("rejects missing configuration without including configured secret values", () => {
	const environment = { ...validEnvironment, ANVIA_LENS_PUBLIC_KEY: "" };
	assert.throws(
		() => resolveLensSmokeConfig(environment),
		(error) => {
			assert.ok(error instanceof LensSmokeConfigurationError);
			assert.doesNotMatch(error.message, /secret-test-value/);
			return true;
		},
	);
});

test("rejects a non-local Lens destination", () => {
	assert.throws(
		() =>
			resolveLensSmokeConfig({
				...validEnvironment,
				ANVIA_LENS_BASE_URL: "https://example.invalid",
			}),
		LensSmokeConfigurationError,
	);
});
