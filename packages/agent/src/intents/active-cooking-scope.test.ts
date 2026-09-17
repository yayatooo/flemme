import { describe, expect, test } from "bun:test";
import { AYAM_KECAP_COOKING_PLAN } from "../fixtures/ayam-kecap-cooking-plan";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { ActiveCookingInputSchema } from "../schemas/active-cooking-input";
import { runActiveCooking } from "./active-cooking";
import {
	createActiveCookingScopeResponse,
	enforceActiveCookingScopeActions,
	resolveActiveCookingScope,
} from "./active-cooking-scope";

const baseInput = ActiveCookingInputSchema.parse({
	cookingPlan: AYAM_KECAP_COOKING_PLAN,
	session: {
		status: "active",
		currentStageId: "stage-cook-aromatics",
		currentStepId: "heat-oil",
		completedStepIds: [
			"prep-cut-chicken",
			"prep-slice-aromatics",
			"prep-measure-sauce",
		],
		changes: [],
	},
	message: "What should I do next?",
});

function input(message: string) {
	return ActiveCookingInputSchema.parse({ ...baseInput, message });
}

describe("Active Cooking scope guard", () => {
	test.each([
		"What is HTML?",
		"Explain React hooks.",
		"Who won the World Cup?",
		"Write an email for me.",
		"Explain photosynthesis.",
	])("blocks off-topic input before normal generation: %s", async (message) => {
		const scopedInput = input(message);
		const decision = resolveActiveCookingScope(scopedInput);
		const response = createActiveCookingScopeResponse(decision, scopedInput);
		if (!response) throw new Error("Expected a deterministic scope response");

		expect(decision).toEqual({ scope: "off_topic" });
		expect(response?.actions).toEqual([]);
		expect(response?.reply).toContain("this cooking session");

		if (message.includes("HTML")) {
			expect(response?.reply.toLowerCase()).not.toContain("html");
			expect(response?.reply.toLowerCase()).not.toContain("markup");
			const runtimeResponse = await runActiveCooking({
				model: null as never,
				input: scopedInput,
			});
			expect(runtimeResponse).toEqual(response);
		}
	});

	test.each([
		"Is this cooked enough?",
		"The onions are burning.",
		"My gas ran out.",
		"Can I use a wok instead?",
		"I only have 2 eggs.",
		"Can I reduce the chili?",
		"What should I do next?",
		"The oil is smoking, what should I do?",
		"The pan caught fire.",
	])("keeps cooking and safety guidance in scope: %s", (message) => {
		expect(resolveActiveCookingScope(input(message))).toEqual({
			scope: "in_scope",
		});
	});

	test("uses current cooking context before treating medium as off-topic", () => {
		expect(resolveActiveCookingScope(input("What does medium mean?"))).toEqual({
			scope: "in_scope",
		});
	});

	test("returns a cooking-specific clarification for genuinely ambiguous input", () => {
		const scopedInput = input("Is this okay?");
		const decision = resolveActiveCookingScope(scopedInput);
		const response = createActiveCookingScopeResponse(decision, scopedInput);

		expect(decision).toEqual({ scope: "ambiguous" });
		expect(response?.actions).toEqual([]);
		expect(response?.reply).toContain(
			"Heat the cooking oil in the wok over medium heat.",
		);
	});

	test.each([
		["How many calories is this?", "nutrition", "after cooking is complete"],
		["Save this to favorites.", "favorites", "save this meal"],
		["Show my cooking history.", "history", "outside this active session"],
	] as const)(
		"redirects out-of-phase input without actions: %s",
		(message, topic, replyFragment) => {
			const scopedInput = input(message);
			const decision = resolveActiveCookingScope(scopedInput);
			const response = createActiveCookingScopeResponse(decision, scopedInput);

			expect(decision).toEqual({ scope: "out_of_phase", topic });
			expect(response?.actions).toEqual([]);
			expect(response?.reply.toLowerCase()).toContain(replyFragment);
		},
	);

	test("post-output enforcement strips lifecycle actions outside cooking scope", () => {
		const unsafeOutput = {
			reply: "Move forward.",
			actions: [{ type: "advance" as const }],
		};

		expect(
			enforceActiveCookingScopeActions("off_topic", unsafeOutput).actions,
		).toEqual([]);
		expect(
			enforceActiveCookingScopeActions("out_of_phase", unsafeOutput).actions,
		).toEqual([]);
		expect(
			enforceActiveCookingScopeActions("ambiguous", unsafeOutput).actions,
		).toEqual([]);
		expect(
			enforceActiveCookingScopeActions("in_scope", unsafeOutput).actions,
		).toEqual([{ type: "advance" }]);
	});

	test("shared instructions retain the runtime scope rules as defense in depth", () => {
		expect(COOKING_INSTRUCTIONS).toContain("ACTIVE COOKING SCOPE");
		expect(COOKING_INSTRUCTIONS).toContain(
			"Do not answer unrelated general-knowledge",
		);
		expect(COOKING_INSTRUCTIONS).toContain(
			"Relevant kitchen and food-safety questions remain in scope",
		);
	});
});
