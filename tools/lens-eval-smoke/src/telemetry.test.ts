import assert from "node:assert/strict";
import { test } from "node:test";
import {
	allowlistTelemetryMetadata,
	LENS_REPORTER_PRIVACY_OPTIONS,
	serializeSafeTelemetryMetadata,
} from "./telemetry.ts";

test("serializes allowlisted metadata deterministically", () => {
	const serialized = serializeSafeTelemetryMetadata({
		modelIdentifier: "synthetic-static",
		caseId: "flemme-synthetic-recommendation-001",
		phase: "recommendation",
	});
	assert.equal(
		serialized,
		'{"phase":"recommendation","caseId":"flemme-synthetic-recommendation-001","modelIdentifier":"synthetic-static"}',
	);
});

test("rejects raw input, output, personal context, and secret-bearing fields", () => {
	for (const field of [
		"input",
		"output",
		"error",
		"prompt",
		"email",
		"inventory",
		"equipment",
		"household",
		"preferences",
		"cookingPlan",
		"sessionId",
		"headers",
		"environmentDump",
		"arbitrary",
		"secretKey",
	]) {
		assert.throws(
			() => allowlistTelemetryMetadata({ [field]: "must-not-be-sent" }),
			/Telemetry metadata field is not allowed/,
		);
	}
});

test("rejects secret-like values even under an allowlisted metadata key", () => {
	for (const value of [
		"secret-test-value",
		"password=must-not-pass",
		"Bearer must-not-pass",
		"sk-must-not-pass-12345678",
	]) {
		assert.throws(
			() => allowlistTelemetryMetadata({ environment: value }),
			/forbidden value/,
		);
	}
});

test("accepts only known phases and the literal synthetic flag", () => {
	assert.deepEqual(
		allowlistTelemetryMetadata({ phase: "completion", synthetic: true }),
		{ phase: "completion", synthetic: true },
	);
	assert.throws(
		() => allowlistTelemetryMetadata({ phase: "inventory" }),
		/phase is not allowed/,
	);
	assert.throws(
		() => allowlistTelemetryMetadata({ synthetic: false }),
		/synthetic flag must be true/,
	);
});

test("omits eval inputs and outputs from Lens reporter payloads by default", () => {
	assert.equal(LENS_REPORTER_PRIVACY_OPTIONS.includePayloads, false);
	const serialized = serializeSafeTelemetryMetadata({
		phase: "recommendation",
		caseId: "flemme-synthetic-recommendation-001",
	});
	assert.doesNotMatch(serialized, /synthetic-input-redacted/);
	assert.doesNotMatch(serialized, /synthetic-output-redacted/);
});
