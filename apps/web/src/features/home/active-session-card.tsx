import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface ActiveSessionSummary {
	id: string;
	recipeName: string;
	progressLabel: string;
}

interface ActiveSessionCardProps {
	session: ActiveSessionSummary | null;
	onContinue?: (sessionId: string) => void;
}

export function ActiveSessionCard({
	session,
	onContinue,
}: ActiveSessionCardProps) {
	if (!session) return null;

	return (
		<section aria-labelledby="active-session-heading" className="space-y-3">
			<h2 id="active-session-heading" className="font-heading text-2xl">
				Continue Cooking
			</h2>
			<Card className="bg-mustard shadow-none">
				<CardHeader>
					<Badge variant="outline">In progress</Badge>
					<h3 className="font-heading text-2xl leading-tight">
						{session.recipeName}
					</h3>
					<p className="text-sm font-bold text-muted-foreground">
						{session.progressLabel}
					</p>
				</CardHeader>
				{onContinue ? (
					<CardContent className="flex justify-end">
						<Button type="button" onClick={() => onContinue(session.id)}>
							Continue
							<ArrowRight aria-hidden="true" />
						</Button>
					</CardContent>
				) : null}
			</Card>
		</section>
	);
}
