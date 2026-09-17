import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CookingChange = CookingSessionResponse["session"]["changes"][number];

const changeKindLabels: Record<CookingChange["kind"], string> = {
	equipment: "Equipment",
	ingredient: "Ingredient",
	other: "Other",
	servings: "Servings",
	step: "Cooking step",
};

interface CompletionChangesProps {
	changes: CookingChange[];
}

export function CompletionChanges({ changes }: CompletionChangesProps) {
	return (
		<section aria-labelledby="completion-changes-title">
			<Card>
				<CardHeader className="gap-2">
					<ListChecks className="size-8" aria-hidden="true" />
					<CardTitle id="completion-changes-title">Changes you made</CardTitle>
				</CardHeader>
				<CardContent>
					{changes.length === 0 ? (
						<p className="leading-relaxed text-muted-foreground">
							You followed the original cooking plan without recorded changes.
						</p>
					) : (
						<ul className="space-y-4">
							{changes.map((change) => (
								<li
									key={`${change.kind}-${change.relatedStepId ?? "session"}-${change.description}`}
									className="space-y-2 border-t-2 pt-4 first:border-t-0 first:pt-0"
								>
									<Badge variant="outline">
										{changeKindLabels[change.kind]}
									</Badge>
									<p className="leading-relaxed font-bold">
										{change.description}
									</p>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
