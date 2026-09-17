import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CompletionChanges } from "./completion-changes";
import { CompletionLoading } from "./completion-loading";
import { CompletionNotes } from "./completion-notes";
import { CompletionSummary } from "./completion-summary";

const completion = {
	reply: "You finished dinner and kept the cooking plan on track.",
	summary: {
		title: "Dinner is ready",
		description: "The final step and every recorded change are saved.",
	},
	notes: ["Use the same lower heat next time."],
};

test("Completion review presents persisted reply, summary, changes, and notes", () => {
	const markup = renderToStaticMarkup(
		<>
			<CompletionSummary completion={completion} />
			<CompletionChanges
				changes={[
					{
						kind: "step",
						description: "Lowered the heat before finishing.",
						relatedStepId: "finish-chicken",
					},
				]}
			/>
			<CompletionNotes notes={completion.notes} />
		</>,
	);

	expect(markup).toContain("Flemme&#x27;s reflection");
	expect(markup).toContain(completion.reply);
	expect(markup).toContain(completion.summary.title);
	expect(markup).toContain("Changes you made");
	expect(markup).toContain("Lowered the heat before finishing.");
	expect(markup).toContain("Notes for next time");
	expect(markup).toContain(completion.notes[0]);
});

test("empty changes stay explicit while empty notes are omitted", () => {
	const changes = renderToStaticMarkup(<CompletionChanges changes={[]} />);
	const notes = renderToStaticMarkup(<CompletionNotes notes={[]} />);

	expect(changes).toContain("followed the original cooking plan");
	expect(notes).toBe("");
});

test("loading keeps the persisted custom name visible without fake output", () => {
	const markup = renderToStaticMarkup(
		<CompletionLoading displayName="Weeknight chicken" />,
	);

	expect(markup).toContain("Weeknight chicken");
	expect(markup).toContain("Preparing your Completion review");
	expect(markup).not.toContain(completion.reply);
});
