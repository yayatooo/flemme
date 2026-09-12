import { describe, expect, test } from "bun:test";

import { CompletionOutputSchema } from "./completion-output";

const validOutput = {
	reply: "Berhasil! Ayam kecapmu sudah selesai.",
	summary: {
		title: "Ayam Kecap",
		description:
			"Ayam kecap selesai dimasak dengan tumisan aromatik dan kecap manis.",
	},
	notes: ["Cicipi kembali sebelum disajikan karena garam sempat ditambahkan."],
};

describe("CompletionOutputSchema", () => {
	test("accepts a completion result without notes", () => {
		const result = CompletionOutputSchema.safeParse({
			...validOutput,
			notes: [],
		});

		expect(result.success).toBe(true);
	});

	test("accepts useful final notes", () => {
		expect(CompletionOutputSchema.safeParse(validOutput).success).toBe(true);
	});

	test.each([
		{
			name: "empty reply",
			output: { ...validOutput, reply: " " },
		},
		{
			name: "empty summary title",
			output: {
				...validOutput,
				summary: { ...validOutput.summary, title: " " },
			},
		},
		{
			name: "empty summary description",
			output: {
				...validOutput,
				summary: { ...validOutput.summary, description: " " },
			},
		},
		{
			name: "empty note",
			output: { ...validOutput, notes: [" "] },
		},
	])("rejects $name", ({ output }) => {
		expect(CompletionOutputSchema.safeParse(output).success).toBe(false);
	});
});
