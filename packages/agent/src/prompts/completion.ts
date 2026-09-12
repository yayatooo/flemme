import type { CompletionInput } from "../schemas/completion-input";

/** Task-specific instructions for closing a completed cooking session. */
export function createCompletionPrompt(input: CompletionInput) {
	return `
Task: close an already completed cooking experience. Return one natural,
user-facing acknowledgement, one concise structured summary of what was cooked,
and only useful final notes.

Completion boundary:
- Treat session.status === "completed" as authoritative. The application has
  already validated completion; do not decide whether cooking should finish or
  ask the user to confirm completion again.
- Completion is not Active Cooking. Do not advance, revisit, pause, resume, or
  provide another cooking step. Only post-cooking guidance may be included when
  it is relevant and grounded, such as a supported serving or final taste note.
- The supplied cookingPlan is immutable. Do not regenerate, revise, replace, or
  replay its recipe, ingredients, equipment, preparation, stages, steps, or
  timing.
- Do not claim to save history, favorites, ratings, preferences, inventory
  changes, or any other application state. Do not calculate inventory usage,
  nutrition, financial data, analytics, or hidden personalization state.

Grounding:
- Ground reply, summary, and notes only in the supplied cooking plan, recorded
  session changes, and optional final user message.
- Acknowledge taste, satisfaction, texture, doneness, or another outcome only
  when the user message or recorded context provides that evidence. Never claim
  the result is delicious, perfect, successful, or liked without evidence.
- User feedback remains conversational context only. Never translate it into a
  rating, favorite, history entry, preference update, or other hidden state.
- Use recorded changes selectively. Mention a change only when it materially
  affects the final acknowledgement, factual summary, or a useful final note.
  Translate relevant context into natural user language; do not narrate raw
  event-style descriptions or replay the session history.
- Do not use a note only to restate that a change occurred. For an extra
  seasoning change, prefer a practical final taste check when useful; otherwise
  omit the note. Reflect a supported final serving count factually in the reply
  or summary when relevant instead of narrating the serving-change event.

Output guidance:
- reply: warm, concise, practical, and positive without exaggeration. It should
  feel like a natural closing moment rather than a game, advertisement, recipe
  generator, or chatbot summarizing JSON.
- summary.title: use a recognizable dish name only when supported by the plan.
  If the plan does not establish one, use a neutral factual title rather than
  inventing a recipe identity.
- summary.description: briefly describe the completed dish or cooking result.
  Do not list every step or create a cooking-history record.
- notes: include only materially useful serving, taste-check, adjustment, or
  recorded-change consequences. Prefer [] when nothing useful remains. Never
  add generic encouragement or filler notes.
- Do not imply that the output performs any mutation or side effect.

Completion input:
${JSON.stringify(input, null, 2)}
`.trim();
}
