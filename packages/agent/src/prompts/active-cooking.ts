import type { ActiveCookingInput } from "../schemas/active-cooking-input";

/** Task-specific instructions for reasoning within an active cooking session. */
export function createActiveCookingPrompt(input: ActiveCookingInput) {
	const currentStage = input.cookingPlan.cookingStages.find(
		(stage) => stage.id === input.session.currentStageId,
	);
	const currentStep = currentStage?.steps.find(
		(step) => step.id === input.session.currentStepId,
	);

	return `
Task: respond to the latest user message within an existing Active Cooking
session. Return a concise user-facing reply and only the structured actions that
the application should consider applying. An empty actions array is correct when
the user only needs guidance and no session change is proposed.

Session continuity:
- The supplied cookingPlan is an immutable plan that is already being executed.
  Never regenerate, rewrite, replace, restart, or reorder its recipe,
  ingredients, equipment, preparation steps, cooking stages, steps, or timing.
- Reason from the supplied session status, current stage ID, current step ID,
  completed step IDs, recorded changes, and latest message. Do not assume
  unrecorded progress.
- Ground current guidance in the resolved current stage and step below. Focus on
  what the user should do now; do not repeat the whole recipe or overload them
  with future steps.
- A step is not complete merely because it was shown or previously explained.
  Propose progress only when the latest interaction gives sufficient evidence
  that the physical action occurred or the user explicitly marks it complete.
- Use observable completion cues from the current step when available. Preserve
  qualitative timing and do not invent exact durations.

Proposed action rules:
- advance: use only when the current non-final cooking step is clearly complete
  or the user explicitly asks to mark it finished. Never provide a next stage or
  step ID; the application derives navigation from the immutable plan. In an
  active session, an unqualified completion such as "udah selesai", "sudah",
  or "next" refers to the current step and is sufficient unless the message or
  recorded context introduces another plausible referent.
- previous-step: use when the user explicitly asks to revisit the previous
  cooking instruction. It does not undo physical actions or completedStepIds.
- pause: preserve the exact position when the user temporarily stops or cannot
  continue. Choose the supplied reason vocabulary. Missing ingredients,
  shopping, equipment problems, and interruptions are pauses, not abandonment.
  Use user-request for an explicit manual pause such as "pause dulu". Use the
  more specific missing-ingredient or missing-equipment reason when stated, and
  reserve interruption for another external interruption.
- resume: use only for a paused session when the user indicates they can
  continue. Resume keeps the same plan, stage, and step; it does not advance or
  restart.
- record-change: propose only meaningful real-world context needed by later
  cooking interactions, such as ingredient, equipment, servings, or externally
  performed step changes. Do not use it as generic conversation memory. Add a
  relatedStepId only when it refers to a real step in the supplied plan.
- complete-cooking: use only when the current step is the final cooking step and
  the latest interaction establishes that the user actually completed it. Do
  not complete merely because the final instruction was shown.
- abandon-cooking: use only when the user explicitly says they are abandoning
  or ending the cooking session. Never infer it from inactivity, navigation,
  shopping, missing items, or equipment failure.
- clarify: use alone when the message is too ambiguous to propose a safe session
  change. Put the concise question in reply and do not guess progress.
  A standalone negation such as "belum" has no clear referent in this input and
  requires clarification rather than assumed progress or guidance.
- Guidance that does not propose a session change uses actions: [].
- Multiple record-change actions may be combined with one justified action.
  Follow all cross-action constraints in the output contract.
- These are proposals only. Do not return a replacement session, mutate the
  plan, claim persistence occurred, or calculate navigation targets.

Resolved current stage:
${JSON.stringify(currentStage, null, 2)}

Resolved current step:
${JSON.stringify(currentStep, null, 2)}

Complete Active Cooking input:
${JSON.stringify(input, null, 2)}
`.trim();
}
