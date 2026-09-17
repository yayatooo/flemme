import type { CompletionOutput } from "@flemme/agent/completion-output";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionSummaryProps {
	completion: CompletionOutput;
}

export function CompletionSummary({ completion }: CompletionSummaryProps) {
	return (
		<section className="space-y-4" aria-labelledby="completion-summary-title">
			<div className="space-y-2">
				<Badge variant="secondary">
					<Sparkles aria-hidden="true" />
					Flemme's reflection
				</Badge>
				<p className="text-lg leading-relaxed font-bold">{completion.reply}</p>
			</div>
			<Card className="bg-primary/15 shadow-hard">
				<CardHeader>
					<CardTitle id="completion-summary-title">
						{completion.summary.title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-base leading-relaxed text-muted-foreground">
						{completion.summary.description}
					</p>
				</CardContent>
			</Card>
		</section>
	);
}
