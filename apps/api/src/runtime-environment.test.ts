import { expect, test } from "bun:test";
import { readRuntimeEnvironment } from "./runtime-environment";

test("runtime configuration has safe local defaults", () => {
	expect(readRuntimeEnvironment({})).toEqual({
		API_HOST: "127.0.0.1",
		PORT: 3000,
	});
});

test("runtime configuration accepts the container bind contract", () => {
	expect(readRuntimeEnvironment({ API_HOST: "0.0.0.0", PORT: "8080" })).toEqual(
		{ API_HOST: "0.0.0.0", PORT: 8080 },
	);
});

test("runtime configuration rejects ambiguous hosts and invalid ports", () => {
	for (const input of [
		{ API_HOST: "localhost" },
		{ API_HOST: "::" },
		{ PORT: "0" },
		{ PORT: "not-a-port" },
	]) {
		expect(() => readRuntimeEnvironment(input)).toThrow(
			"Invalid API runtime configuration",
		);
	}
});
