import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { CheckCircle2, Flame } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimingBadge } from "@/features/pre-cooking/timing-badge";

type CookingStep = PreCookingOutput["cookingStages"][number]["steps"][number];

interface CurrentStepCardProps {
	step: CookingStep;
	stepNumber: number;
	totalSteps: number;
}

export function CurrentStepCard({
	step,
	stepNumber,
	totalSteps,
}: CurrentStepCardProps) {
	return (
		<Card className="bg-card shadow-hard-lg">
			<CardHeader className="gap-4">
				<div className="flex items-center justify-between gap-3">
					<p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
						Current step · {stepNumber} of {totalSteps}
					</p>
					<div className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-foreground bg-primary text-primary-foreground">
						<Flame className="size-5" aria-hidden="true" />
					</div>
				</div>
				<h1 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
					{step.instruction}
				</h1>
			</CardHeader>
			{step.timing ? (
				<CardContent className="space-y-4 border-t-2 border-foreground pt-5">
					<TimingBadge level={step.timing.level} />
					{step.timing.cue ? (
						<div className="flex items-start gap-3 rounded-2xl bg-success/35 p-4">
							<CheckCircle2
								className="mt-0.5 size-5 shrink-0"
								aria-hidden="true"
							/>
							<div>
								<p className="text-xs font-extrabold tracking-wide uppercase">
									Ready when
								</p>
								<p className="mt-1 text-base font-bold leading-relaxed">
									{step.timing.cue}
								</p>
							</div>
						</div>
					) : null}
				</CardContent>
			) : null}
		</Card>
	);
}
