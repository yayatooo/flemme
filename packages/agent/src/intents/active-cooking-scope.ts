import type { ActiveCookingInput } from "../schemas/active-cooking-input";
import {
	type ActiveCookingOutput,
	ActiveCookingOutputSchema,
} from "../schemas/active-cooking-output";
import type {
	ActiveCookingOutOfPhaseTopic,
	ActiveCookingScope,
} from "../schemas/active-cooking-scope";

export type ActiveCookingScopeDecision =
	| { scope: "in_scope" | "off_topic" | "ambiguous" }
	| { scope: "out_of_phase"; topic: ActiveCookingOutOfPhaseTopic };

const OUT_OF_PHASE_RULES: ReadonlyArray<{
	topic: ActiveCookingOutOfPhaseTopic;
	pattern: RegExp;
}> = [
	{
		topic: "nutrition",
		pattern:
			/\b(calorie|calories|caloric|nutrition|nutritional|macros?|kilojoules?)\b/i,
	},
	{
		topic: "favorites",
		pattern:
			/\b(favorites?|favourites?|bookmark)\b|\bsave (this|the) (meal|dish|recipe)\b/i,
	},
	{
		topic: "history",
		pattern:
			/\b(cooking history|meal history|past (meals?|cooks?|sessions?)|previous (meals?|sessions?))\b/i,
	},
	{
		topic: "profile",
		pattern:
			/\b(profile|onboarding|household profile|household settings|dietary profile)\b/i,
	},
	{
		topic: "inventory",
		pattern:
			/\b(update|edit|change|open|show|manage)\b.{0,24}\b(inventory|pantry)\b|\b(inventory|pantry)\b.{0,24}\b(update|edit|change|management)\b/i,
	},
	{
		topic: "recommendation",
		pattern:
			/\b(recommend|suggest|choose|find)\b.{0,24}\b(another|new|different)\b.{0,12}\b(recipe|meal|dish)\b|\bstart over with another recipe\b/i,
	},
	{
		topic: "pre_cooking",
		pattern:
			/\b(regenerate|rewrite|replace|edit)\b.{0,18}\b(cooking plan|recipe plan|whole plan)\b/i,
	},
	{
		topic: "completion",
		pattern:
			/\b(show|generate|write|give)\b.{0,20}\b(completion review|final review|meal summary|cooking summary)\b/i,
	},
];

const EXPLICIT_OFF_TOPIC_PATTERN =
	/\b(html|css|javascript|typescript|react hooks?|bitcoin|cryptocurrency|fedora|linux install|world war|world cup|president|weather forecast|stock market|write (an|a|my) email|translate (this|an|the) (unrelated )?(paragraph|document)|hypertext markup language|application programming interface|rest api|web api|what is api|explain api)\b/i;

const COOKING_DOMAIN_PATTERN =
	/\b(cook|cooked|cooking|done|doneness|ready|raw|burn|burning|burnt|smoke|smoking|fire|flame|heat|hot|stove|gas|pan|wok|pot|oven|oil|ingredient|substitute|substitution|swap|replace|equipment|knife|spatula|timer|timing|minute|serve|serving|portion|egg|eggs|chili|chilli|onion|onions|shallot|shallots|garlic|salt|sauce|water|taste|texture|color|colour|smell|stir|mix|turn|flip|boil|simmer|fry|saute|sauté|bake|grill|reduce|thicken|recipe|quantity|amount|api|kompor|wajan|panci|minyak|telur|cabai|bawang|garam|saus|matang|mentah|gosong|terbakar|asap|panas|aduk|rebus|goreng|tumis|panggang|rasa|tekstur|habis|belum)\b/i;

const LIFECYCLE_PATTERN =
	/\b(next( step)?|previous( step)?|go back|pause|resume|continue|stop cooking|abandon|finish cooking|mark (it|this|the step) (done|complete)|lanjut|kembali|jeda|berhenti|selesai)\b/i;

const QUANTITY_OR_SUBSTITUTION_PATTERN =
	/\b(only have|i have|use instead|use .+ instead|less|more|reduce|increase|how much|how many|berapa|ganti|kurangi|tambah)\b/i;

const AMBIGUOUS_PATTERN =
	/^(is (this|it) (okay|ok|right)|is this fine|what about this|does this look right|how is this|is this safe)\??$/i;

const CONTEXT_STOP_WORDS: Record<string, true> = {
	about: true,
	after: true,
	again: true,
	and: true,
	before: true,
	cooking: true,
	current: true,
	dan: true,
	dengan: true,
	from: true,
	into: true,
	over: true,
	step: true,
	than: true,
	that: true,
	the: true,
	this: true,
	through: true,
	until: true,
	untuk: true,
	with: true,
	yang: true,
};

function normalizedWords(value: string) {
	return (
		value
			.normalize("NFKD")
			.toLowerCase()
			.match(/[\p{L}\p{N}]+/gu) ?? []
	);
}

function appendStringValues(value: unknown, target: string[]) {
	if (typeof value === "string") {
		target.push(value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) appendStringValues(item, target);
		return;
	}
	if (value && typeof value === "object") {
		for (const item of Object.values(value)) appendStringValues(item, target);
	}
}

function hasCookingContextOverlap(input: ActiveCookingInput) {
	const contextValues: string[] = [];
	appendStringValues(input.cookingPlan, contextValues);
	appendStringValues(input.session.changes, contextValues);
	const contextTerms = new Set(
		normalizedWords(contextValues.join(" ")).filter(
			(word) => word.length >= 3 && !CONTEXT_STOP_WORDS[word],
		),
	);
	return normalizedWords(input.message).some(
		(word) =>
			word.length >= 3 && !CONTEXT_STOP_WORDS[word] && contextTerms.has(word),
	);
}

export function resolveActiveCookingScope(
	input: ActiveCookingInput,
): ActiveCookingScopeDecision {
	for (const rule of OUT_OF_PHASE_RULES) {
		if (rule.pattern.test(input.message)) {
			return { scope: "out_of_phase", topic: rule.topic };
		}
	}

	if (EXPLICIT_OFF_TOPIC_PATTERN.test(input.message)) {
		return { scope: "off_topic" };
	}

	if (
		COOKING_DOMAIN_PATTERN.test(input.message) ||
		LIFECYCLE_PATTERN.test(input.message) ||
		QUANTITY_OR_SUBSTITUTION_PATTERN.test(input.message) ||
		hasCookingContextOverlap(input)
	) {
		return { scope: "in_scope" };
	}

	if (AMBIGUOUS_PATTERN.test(input.message.trim())) {
		return { scope: "ambiguous" };
	}

	return { scope: "off_topic" };
}

const OUT_OF_PHASE_REPLIES: Record<ActiveCookingOutOfPhaseTopic, string> = {
	nutrition:
		"We'll review nutrition after cooking is complete. For now, I can help with the current step.",
	favorites:
		"You can save this meal after cooking is complete. Let's keep going with the current step.",
	history:
		"Cooking history is available outside this active session. I can help you finish the current step first.",
	profile:
		"Profile and household settings are managed outside Active Cooking. I can help with the current cooking step.",
	inventory:
		"Inventory management happens outside Active Cooking. I can help adapt the current step without changing inventory.",
	recommendation:
		"Recipe recommendations happen before Active Cooking. I can help you safely continue or adjust this cooking session.",
	pre_cooking:
		"The approved cooking plan stays fixed during Active Cooking. I can help explain or safely adapt the current step.",
	completion:
		"The Completion review becomes available after cooking is finished. For now, I can help with the current step.",
};

function currentStepInstruction(input: ActiveCookingInput) {
	const currentStage = input.cookingPlan.cookingStages.find(
		(stage) => stage.id === input.session.currentStageId,
	);
	return currentStage?.steps.find(
		(step) => step.id === input.session.currentStepId,
	)?.instruction;
}

export function createActiveCookingScopeResponse(
	decision: ActiveCookingScopeDecision,
	input: ActiveCookingInput,
): ActiveCookingOutput | null {
	if (decision.scope === "in_scope") return null;

	if (decision.scope === "out_of_phase") {
		return ActiveCookingOutputSchema.parse({
			reply: OUT_OF_PHASE_REPLIES[decision.topic],
			actions: [],
		});
	}

	if (decision.scope === "ambiguous") {
		const instruction = currentStepInstruction(input);
		return ActiveCookingOutputSchema.parse({
			reply: instruction
				? `I can help with this cooking step, but I need a little more detail. What are you noticing or trying to decide about "${instruction}"?`
				: "I can help with this cooking session, but I need a little more detail about what you want to check.",
			actions: [],
		});
	}

	return ActiveCookingOutputSchema.parse({
		reply:
			"I'm here to help with this cooking session. Ask me about the current step, ingredients, equipment, substitutions, cooking cues, or what to do next.",
		actions: [],
	});
}

export function enforceActiveCookingScopeActions(
	scope: ActiveCookingScope,
	output: ActiveCookingOutput,
): ActiveCookingOutput {
	const validated = ActiveCookingOutputSchema.parse(output);
	if (scope === "in_scope") return validated;
	return { ...validated, actions: [] };
}
