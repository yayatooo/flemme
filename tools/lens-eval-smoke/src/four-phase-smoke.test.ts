import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import type {
	EvalReportArgs,
	EvalReporter,
	EvalRunEndArgs,
	EvalRunStartArgs,
} from "@anvia/core/evals";

import {
	FOUR_PHASE_METRIC_NAME,
	FOUR_PHASE_SMOKE_DEFINITIONS,
	runFourPhaseSmoke,
} from "./four-phase-smoke.ts";

const expectedIdentities = [
	[
		"recommendation",
		"flemme.eval.smoke.recommendation",
		"flemme-synthetic-recommendation-001",
	],
	[
		"pre-cooking",
		"flemme.eval.smoke.pre-cooking",
		"flemme-synthetic-pre-cooking-001",
	],
	[
		"active-cooking",
		"flemme.eval.smoke.active-cooking",
		"flemme-synthetic-active-cooking-001",
	],
	[
		"completion",
		"flemme.eval.smoke.completion",
		"flemme-synthetic-completion-001",
	],
] as const;

test("defines exactly four stable and unique synthetic phase identities", () => {
	assert.deepEqual(
		FOUR_PHASE_SMOKE_DEFINITIONS.map(({ phase, suiteName, caseId }) => [
			phase,
			suiteName,
			caseId,
		]),
		expectedIdentities,
	);
	assert.equal(
		new Set(FOUR_PHASE_SMOKE_DEFINITIONS.map(({ suiteName }) => suiteName))
			.size,
		4,
	);
	assert.equal(
		new Set(FOUR_PHASE_SMOKE_DEFINITIONS.map(({ caseId }) => caseId)).size,
		4,
	);
});

test("runs one passing deterministic metric for each synthetic phase", async () => {
	const starts: EvalRunStartArgs[] = [];
	const reports: EvalReportArgs<string, string>[] = [];
	const ends: EvalRunEndArgs[] = [];
	const lifecycle: string[] = [];
	const reporter: EvalReporter<string, string, unknown> = {
		onRunStart(args) {
			starts.push(args);
		},
		report(args) {
			reports.push(args);
		},
		onRunEnd(args) {
			ends.push(args);
		},
	};

	const receipts = await runFourPhaseSmoke({
		reporter,
		flush: async () => {
			lifecycle.push("flush");
		},
		close: async () => {
			lifecycle.push("close");
		},
		runtime: "node-24.15.0",
		environment: "test",
	});

	assert.equal(starts.length, 4);
	assert.equal(reports.length, 4);
	assert.equal(ends.length, 4);
	assert.deepEqual(lifecycle, ["flush", "close"]);
	assert.deepEqual(
		reports.map(({ metric, outcome, case: testCase }) => ({
			metric: metric.name,
			outcome: outcome.outcome,
			synthetic: testCase.metadata?.synthetic,
		})),
		Array.from({ length: 4 }, () => ({
			metric: FOUR_PHASE_METRIC_NAME,
			outcome: "pass",
			synthetic: true,
		})),
	);
	assert.ok(ends.every(({ status }) => status === "completed"));
	assert.deepEqual(
		receipts.map(({ phase, suiteName, caseId, status, payloadStatus }) => ({
			phase,
			suiteName,
			caseId,
			status,
			payloadStatus,
		})),
		expectedIdentities.map(([phase, suiteName, caseId]) => ({
			phase,
			suiteName,
			caseId,
			status: "pass",
			payloadStatus: "not_requested",
		})),
	);
});

test("closes cleanly when reporting fails and does not flush", async () => {
	let closeCount = 0;
	let flushCount = 0;
	const reporter: EvalReporter<string, string, unknown> = {
		report() {
			throw new Error("synthetic_report_failure");
		},
	};

	await assert.rejects(
		runFourPhaseSmoke({
			reporter,
			flush: async () => {
				flushCount += 1;
			},
			close: async () => {
				closeCount += 1;
			},
			runtime: "node-24.15.0",
			environment: "test",
		}),
		/Evaluation reporter report failed/,
	);
	assert.equal(flushCount, 0);
	assert.equal(closeCount, 1);
});

test("preserves the Recommendation-only smoke command and identifiers", async () => {
	const packageJson = JSON.parse(
		await readFile(new URL("../package.json", import.meta.url), "utf8"),
	) as { scripts?: Record<string, string> };
	const recommendationSource = await readFile(
		new URL("./run-smoke.ts", import.meta.url),
		"utf8",
	);

	assert.equal(
		packageJson.scripts?.smoke,
		"node --env-file=../../infra/lens-local/.env.flemme-agent src/run-smoke.ts",
	);
	assert.match(
		recommendationSource,
		/const SUITE_NAME = "flemme\.eval\.smoke\.recommendation"/,
	);
	assert.match(
		recommendationSource,
		/const CASE_ID = "flemme-synthetic-recommendation-001"/,
	);
});
