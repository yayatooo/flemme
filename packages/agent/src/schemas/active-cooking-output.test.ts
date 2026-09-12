import { describe, expect, test } from "bun:test";

import { ActiveCookingOutputSchema } from "./active-cooking-output";

describe("ActiveCookingOutputSchema", () => {
	test.each([
		{
			name: "continue cooking",
			output: {
				reply: "Lanjut ke langkah berikutnya.",
				actions: [{ type: "advance" }],
			},
		},
		{
			name: "pause for a missing ingredient",
			output: {
				reply: "Kita pause dulu sampai kecap tersedia.",
				actions: [
					{
						type: "record-change",
						change: {
							kind: "ingredient",
							description: "Kecap manis is unavailable",
						},
					},
					{ type: "pause", reason: "missing-ingredient" },
				],
			},
		},
		{
			name: "resume cooking",
			output: {
				reply: "Kita lanjut dari langkah yang tadi.",
				actions: [{ type: "resume" }],
			},
		},
		{
			name: "ask for clarification",
			output: {
				reply: "Ayamnya sudah masuk ke wajan atau belum?",
				actions: [{ type: "clarify" }],
			},
		},
		{
			name: "complete cooking",
			output: {
				reply: "Masakannya sudah selesai.",
				actions: [{ type: "complete-cooking" }],
			},
		},
		{
			name: "return to the previous step",
			output: {
				reply: "Kita lihat langkah sebelumnya.",
				actions: [{ type: "previous-step" }],
			},
		},
		{
			name: "explicitly abandon cooking",
			output: {
				reply: "Sesi memasak akan dihentikan.",
				actions: [{ type: "abandon-cooking" }],
			},
		},
		{
			name: "record multiple relevant changes",
			output: {
				reply: "Aku catat perubahan bahan dan peralatannya.",
				actions: [
					{
						type: "record-change",
						change: {
							kind: "ingredient",
							description: "More salt was added.",
							relatedStepId: "season-chicken",
						},
					},
					{
						type: "record-change",
						change: {
							kind: "equipment",
							description: "The stove is unavailable.",
						},
					},
				],
			},
		},
	])("accepts $name", ({ output }) => {
		expect(ActiveCookingOutputSchema.safeParse(output).success).toBe(true);
	});

	test.each([
		{
			name: "conflicting lifecycle actions",
			actions: [{ type: "pause", reason: "user-request" }, { type: "resume" }],
		},
		{
			name: "conflicting navigation actions",
			actions: [{ type: "advance" }, { type: "previous-step" }],
		},
		{
			name: "clarification mixed with mutation",
			actions: [{ type: "clarify" }, { type: "advance" }],
		},
		{
			name: "duplicate advance actions",
			actions: [{ type: "advance" }, { type: "advance" }],
		},
	])("rejects $name", ({ actions }) => {
		const result = ActiveCookingOutputSchema.safeParse({
			reply: "...",
			actions,
		});

		expect(result.success).toBe(false);
	});

	test("rejects an empty reply", () => {
		const result = ActiveCookingOutputSchema.safeParse({
			reply: " ",
			actions: [{ type: "advance" }],
		});

		expect(result.success).toBe(false);
	});

	test("accepts an empty action list for guidance without a state change", () => {
		const result = ActiveCookingOutputSchema.safeParse({
			reply: "Panaskan minyak sampai permukaannya mulai berkilau.",
			actions: [],
		});

		expect(result.success).toBe(true);
	});
});
