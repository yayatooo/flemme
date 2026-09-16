import type { ActiveCookingPauseReason } from "@flemme/agent/active-cooking-input";
import { Ban, CheckCircle2, PauseCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pauseReasonLabels: Record<ActiveCookingPauseReason, string> = {
	"user-request": "Paused for now",
	"missing-ingredient": "Buying a missing ingredient",
	"missing-equipment": "Finding different equipment",
	interruption: "Stepped away",
	other: "Other reason",
};

interface PausedSessionStatusProps {
	pauseReason: ActiveCookingPauseReason;
	isPending: boolean;
	onResume: () => void;
}

export function PausedSessionStatus({
	pauseReason,
	isPending,
	onResume,
}: PausedSessionStatusProps) {
	return (
		<Card className="bg-secondary shadow-hard">
			<CardHeader className="gap-3">
				<PauseCircle className="size-9" aria-hidden="true" />
				<CardTitle>Cooking paused</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="font-bold text-muted-foreground">
					{pauseReasonLabels[pauseReason]}
				</p>
				<Button
					type="button"
					size="lg"
					className="w-full"
					disabled={isPending}
					onClick={onResume}
				>
					<Play aria-hidden="true" />
					{isPending ? "Resuming..." : "Resume cooking"}
				</Button>
			</CardContent>
		</Card>
	);
}

interface ClosedSessionStatusProps {
	state: "boundary" | "completed" | "abandoned";
}

export function ClosedSessionStatus({ state }: ClosedSessionStatusProps) {
	const abandoned = state === "abandoned";
	const title = abandoned
		? "Cooking session abandoned"
		: state === "completed"
			? "Cooking completed"
			: "All cooking steps complete";
	const description = abandoned
		? "This session is closed and cannot be resumed."
		: state === "completed"
			? "This cooking session is complete."
			: "Your final step is saved. Completion review starts in the next phase.";

	return (
		<Card
			className={abandoned ? "border-destructive shadow-none" : "bg-success/35"}
		>
			<CardHeader className="gap-3">
				{abandoned ? (
					<Ban className="size-10 text-destructive" aria-hidden="true" />
				) : (
					<CheckCircle2 className="size-10" aria-hidden="true" />
				)}
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="leading-relaxed text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}
