import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionNotesProps {
	notes: string[];
}

export function CompletionNotes({ notes }: CompletionNotesProps) {
	if (notes.length === 0) return null;

	return (
		<section aria-labelledby="completion-notes-title">
			<Card className="bg-secondary/35 shadow-none">
				<CardHeader className="gap-2">
					<Lightbulb className="size-8" aria-hidden="true" />
					<CardTitle id="completion-notes-title">Notes for next time</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-foreground">
						{notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</section>
	);
}
