# Flemme — Active Cooking Guardrails v0.1

## Status

**Safety / Scope Follow-up Task**

Phase 5B Active Cooking is complete.

Before continuing to Phase 7, add explicit scope guardrails to the Active Cooking assistant.

Observed failure:

```text
User asks an unrelated question such as:
"What is HTML?"

Current behavior:
The assistant answers the unrelated general-knowledge question,
then appends cooking context afterward.
```

This violates Flemme's locked product role:

> Active Cooking is a contextual cooking companion, not a generic chatbot.

The goal of this task is to make that boundary enforceable at runtime, not prompt-only.

---

# 1. Core Rule

During an active Cooking Session, the assistant may only help with the current cooking session.

Allowed scope includes:

```text
current cooking step
current cooking stage
cooking plan explanation
ingredient questions
ingredient substitutions
ingredient quantity clarification
equipment questions
equipment alternatives
heat / flame guidance
timing guidance
doneness / completion cues
cooking troubleshooting
kitchen / food safety related to the current cooking task
serving adjustments during the session
recording cooking changes
next / previous step
pause / resume
complete / abandon lifecycle clarification
```

The assistant must not become a general-purpose assistant.

---

# 2. Explicitly Off-Topic

Examples that must NOT receive a normal answer:

```text
"What is HTML?"
"Explain React hooks."
"Who is the president of..."
"What's the weather?"
"Help me write an email."
"Explain Bitcoin."
"Translate this unrelated paragraph."
"Tell me about World War II."
"How do I install Fedora?"
```

Expected behavior:

```text
brief redirect to the active cooking scope
+
zero lifecycle actions
+
zero session mutation
```

---

# 3. Out-of-Phase Requests

Some requests are Flemme-related but belong to another phase.

Examples:

```text
"How many calories is this?"
"Save this to favorites."
"Show my cooking history."
"Change my household profile."
```

During Active Cooking, do not execute these flows.

Treat them as:

```text
out_of_phase
```

Recommended behavior:

```text
Nutrition:
"We'll review nutrition after cooking is complete."

Favorites:
"You can save the meal after cooking is complete."

History/Profile:
redirect without leaving or mutating the current cooking session.
```

No hidden navigation.

No automatic mutation.

---

# 4. Scope Categories

Introduce a small scope result.

Conceptually:

```ts
type ActiveCookingScope =
	| "in_scope"
	| "out_of_phase"
	| "off_topic"
	| "ambiguous";
```

Use the project's schema conventions.

Prefer a shared/agent-local schema where appropriate.

Do not expose unnecessary classifier internals to the web UI.

---

# 5. Do Not Add an Extra Model Call Unnecessarily

Inspect the existing Active Cooking intent layer first.

If Active Cooking already performs intent classification/resolution:

```text
extend that existing intent boundary with scope
```

instead of creating a second classifier request.

Preferred:

```text
message
↓
existing Active Cooking intent/scope resolution
↓
scope decision
↓
run Active Cooking generation only when appropriate
```

Avoid:

```text
scope model call
+
intent model call
+
Active Cooking model call
```

unless the current architecture genuinely requires it.

Keep latency and cost practical.

---

# 6. Runtime Enforcement

Prompt instructions alone are not sufficient.

The runtime must branch before the normal Active Cooking reply generation.

Conceptually:

```ts
const scope = resolveActiveCookingScope(...);

if (scope === "off_topic") {
	return createOffTopicResponse();
}

if (scope === "out_of_phase") {
	return createOutOfPhaseResponse(...);
}

if (scope === "ambiguous") {
	return createScopeClarificationResponse();
}

return runActiveCooking(...);
```

The exact architecture may differ.

The important rule:

> Off-topic messages must not reach the generic Active Cooking generation path.

---

# 7. Deterministic Off-Topic Response

Use a deterministic redirect rather than asking the LLM to answer the unrelated question.

Example:

```text
I'm here to help with this cooking session.
Ask me about the current step, ingredients, equipment,
substitutions, cooking cues, or what to do next.
```

If the application already has a language/locale strategy, use it.

Do not create a large localization system only for this task.

---

# 8. Off-Topic Output Contract

For off-topic input:

```ts
{
	reply: "...scope redirect...",
	actions: [],
}
```

Required:

```text
actions.length === 0
```

No lifecycle mutation is allowed.

---

# 9. Out-of-Phase Output

For out-of-phase input:

```ts
{
	reply: "...phase-aware redirect...",
	actions: [],
}
```

Examples:

### Nutrition

```text
We'll review nutrition after cooking is complete.
For now, I can help with the current step.
```

### Favorite

```text
You can save this meal after cooking is complete.
Let's keep going with the current step.
```

No mutation.

---

# 10. Ambiguous Input

Ambiguous messages should not be treated as off-topic too aggressively.

Example:

```text
"What does medium mean?"
```

In a cooking context this may mean:

```text
medium heat
medium timing level
medium doneness
```

Use the current stage/step context before rejecting it.

If still unclear:

```text
ask a short cooking-specific clarification
```

and return:

```text
actions: []
```

---

# 11. Context-Aware Scope

Scope evaluation must consider:

```text
current recipe
current stage
current step
equipment
ingredients
session state
user message
```

Do not classify only from isolated keywords.

Example:

```text
"HTML"
→ off-topic

"medium"
→ potentially in-scope depending on current step

"gas habis"
→ in-scope cooking troubleshooting / safety

"can I use React?"
→ off-topic

"can I use a wok?"
→ in-scope equipment substitution
```

---

# 12. Cooking Safety Remains In Scope

Do NOT reject relevant cooking-safety questions.

Examples:

```text
"The oil is smoking, what should I do?"
"My gas stove went out."
"Is this chicken cooked enough?"
"The pan caught fire."
```

These are in-scope.

Keep existing product/safety behavior.

The scope guard must not make Flemme useless during real cooking problems.

---

# 13. Phase Awareness

The Active Cooking assistant knows the current phase:

```text
ACTIVE_COOKING
```

Add an explicit runtime/prompt rule:

```text
Do not perform or simulate responsibilities owned by:
- Recommendation
- Pre-Cooking
- Completion
- Nutrition
- Favorites
- History
- Profile / Onboarding
```

It may explain the boundary briefly.

It must not trigger those flows silently.

---

# 14. Update COOKING_INSTRUCTIONS

Strengthen the shared instructions.

Add a clear rule similar to:

```text
ACTIVE COOKING SCOPE

During Active Cooking, answer only questions that directly help the user
execute, understand, troubleshoot, or safely modify the current cooking session.

If a request is unrelated to the current cooking session:
- do not answer the unrelated request,
- briefly redirect to cooking scope,
- return no actions.

If a request belongs to another Flemme phase:
- do not execute that phase,
- tell the user when that phase becomes available,
- return no actions.
```

Prompt rules are defense-in-depth.

Runtime enforcement remains mandatory.

---

# 15. Structured Action Guardrail

After any model-generated Active Cooking output, enforce invariants.

At minimum:

```text
off_topic     → actions must be []
out_of_phase  → actions must be []
ambiguous     → actions must be []
```

If an invalid lifecycle action appears anyway:

```text
discard/reject it
```

Do not execute it.

---

# 16. Existing Action Rules Remain

Preserve:

```text
one lifecycle action per output
clarify only when needed
actions may be []
never silently mutate app state
```

The new scope guard adds another layer.

It does not replace existing action validation.

---

# 17. Do Not Parse Reply Text for Actions

Never infer application behavior from prose.

Bad:

```text
reply says "move to the next step"
→ client advances
```

Correct:

```text
structured action = advance
→ client may persist advance
```

This remains unchanged.

---

# 18. UI Behavior

No large UI redesign is required.

The existing `Ask Flemme` area should display the scope redirect like a normal assistant response.

Example:

```text
Ask Flemme

I'm here to help with this cooking session.
Ask me about this step, ingredients, equipment,
or what to do next.
```

Do not show a system-error card for off-topic input.

It is a valid controlled response.

---

# 19. Input Preservation

For:

```text
off_topic
out_of_phase
ambiguous
```

the user's current Cooking Session state must remain unchanged.

No:

```text
advance
previous
pause
resume
record-change
complete
abandon
```

unless a subsequent valid user request explicitly triggers it.

---

# 20. Agent / Runtime API Shape

Do not break the existing ActiveCookingOutput contract unless necessary.

Preferred:

```text
keep:
reply
actions[]
```

and keep scope classification internal to the runtime/intent layer.

If exposing scope improves testing/observability, add it only if the architecture benefits from it.

Do not add fields merely for UI display.

---

# 21. Observability

Log or trace controlled scope outcomes if current observability infrastructure supports it.

Useful internal values:

```text
in_scope
out_of_phase
off_topic
ambiguous
```

Do not log sensitive free-form user data beyond current project logging policy.

---

# 22. Test Scenarios — Off-Topic

Required tests:

```text
"What is HTML?"
→ no HTML explanation
→ cooking-scope redirect
→ actions = []

"Explain React hooks."
→ redirect
→ actions = []

"Who won the World Cup?"
→ redirect
→ actions = []

"Write an email for me."
→ redirect
→ actions = []
```

---

# 23. Test Scenarios — In Scope

Required tests:

```text
"Is this cooked enough?"
→ in scope

"The onions are burning."
→ in scope

"My gas ran out."
→ in scope

"Can I use a wok instead?"
→ in scope

"I only have 2 eggs."
→ in scope

"Can I reduce the chili?"
→ in scope

"What should I do next?"
→ in scope
```

---

# 24. Test Scenarios — Ambiguous

Required tests:

```text
"What does medium mean?"
→ inspect current cooking context
→ cooking clarification or relevant answer
→ not automatically off-topic

"Is this okay?"
→ use current step context
→ clarify if necessary
```

---

# 25. Test Scenarios — Out of Phase

Required:

```text
"How many calories is this?"
→ no nutrition generation
→ phase-aware redirect
→ actions = []

"Save this to favorites."
→ no Favorite request
→ phase-aware redirect
→ actions = []

"Show my history."
→ no History navigation/mutation
→ phase-aware redirect
→ actions = []
```

---

# 26. Regression Test for Observed Failure

Add an explicit regression test based on the observed behavior:

Input:

```text
HTML (HyperText Markup Language) related/general programming question
```

Expected:

```text
the response must NOT contain an explanation of HTML
the response must redirect to current cooking scope
actions must be empty
session must remain unchanged
```

This regression test is required.

---

# 27. Persistence Tests

For off-topic input verify:

```text
currentStageId unchanged
currentStepId unchanged
completedStepIds unchanged
status unchanged
changes unchanged
```

No Cooking Session mutation request should occur.

---

# 28. Network Verification

For an off-topic Ask Flemme request, verify:

```text
0 progress mutations
0 pause/resume mutations
0 record-change mutations
0 Completion requests
0 Nutrition requests
0 Inventory requests
0 Favorite requests
```

Depending on architecture, the Active Cooking intent/assistant endpoint may still receive the message.

But it must not execute unrelated product actions.

---

# 29. Browser Verification

Use the current Active Cooking UI.

Verify:

```text
ask "What is HTML?"
```

Expected UI:

```text
brief cooking-scope redirect
```

Not:

```text
HTML definition
+
cooking paragraph
```

Also verify the current step and controls remain unchanged.

---

# 30. Validation

Run:

```text
agent tests
web tests
API tests if runtime endpoint changes
Active Cooking integration tests
web typecheck
agent/package typecheck where currently supported
web production build
API build
Biome
Oxlint
```

Keep the known OpenAI declaration parser issue separate if it remains unchanged.

---

# 31. Non-Goals

Do not implement:

```text
Phase 7 Nutrition
new chat history system
general-purpose chatbot
web search
general knowledge tools
new lifecycle actions
new cooking plan schema
```

Do not redesign Active Cooking.

---

# 32. Suggested Implementation Order

```text
1. Inspect existing Active Cooking intent/runtime path.
2. Identify the earliest existing intent boundary.
3. Add scope classification to that boundary.
4. Avoid an extra model call if intent resolution already exists.
5. Add deterministic off-topic handler.
6. Add deterministic out-of-phase handler.
7. Add ambiguous cooking clarification path.
8. Strengthen COOKING_INSTRUCTIONS.
9. Add post-output action invariant enforcement.
10. Add regression test for HTML/general-programming question.
11. Add cooking-safety false-positive tests.
12. Add phase-mismatch tests.
13. Verify session persistence remains unchanged.
14. Browser/network verify.
15. Run validation.
16. Update architecture/progress docs.
```

---

# 33. Definition of Done

- [ ] Active Cooking no longer behaves as a generic chatbot.
- [ ] `in_scope` cooking questions still work.
- [ ] Off-topic questions receive a short cooking-scope redirect.
- [ ] Off-topic questions are not answered substantively.
- [ ] Off-topic outputs contain zero lifecycle actions.
- [ ] Out-of-phase requests receive a phase-aware redirect.
- [ ] Out-of-phase requests trigger no product mutation.
- [ ] Ambiguous requests use current cooking context before rejection.
- [ ] Cooking-safety questions remain in scope.
- [ ] Existing Active Cooking actions remain unchanged for valid requests.
- [ ] Prompt instructions are strengthened.
- [ ] Runtime enforcement exists independently of prompt compliance.
- [ ] Post-output action invariants prevent invalid mutations.
- [ ] HTML regression test passes.
- [ ] Off-topic requests leave persisted progress unchanged.
- [ ] No unrelated product requests occur.
- [ ] Existing Active Cooking tests remain passing.
- [ ] Build/typecheck/lint validation passes.
- [ ] Architecture/progress docs are updated.

---

# 34. Agent Rule

Optimize for:

```text
strict cooking scope
+
minimal latency
+
no unnecessary model calls
+
safe session state
+
helpful cooking redirection
```

Do not optimize for:

```text
answering every user question
generic assistant capability
long refusals
keyword-only blocking
```

Core rule:

> During Active Cooking, Flemme helps the user cook. If the message does not help execute, understand, troubleshoot, or safely adjust the current cooking session, do not answer it as a general assistant.
