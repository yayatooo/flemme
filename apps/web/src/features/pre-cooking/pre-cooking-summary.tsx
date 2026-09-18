import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreCookingSummaryProps {
	summary: PreCookingOutput["preparationSummary"];
}

export function PreCookingSummary({ summary }: PreCookingSummaryProps) {
	return (
		<Card className="border-transparent bg-secondary shadow-card">
			<CardHeader>
				<CardTitle>Get ready</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="leading-relaxed">{summary.overview}</p>
				{summary.preparationTimeMinutes || summary.cookingTimeMinutes ? (
					<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
						{summary.preparationTimeMinutes ? (
							<span className="inline-flex items-center gap-2">
								<Clock3 className="size-4" aria-hidden="true" />
								Prep {summary.preparationTimeMinutes} min
							</span>
						) : null}
						{summary.cookingTimeMinutes ? (
							<span className="inline-flex items-center gap-2">
								<Clock3 className="size-4" aria-hidden="true" />
								Cook {summary.cookingTimeMinutes} min
							</span>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
