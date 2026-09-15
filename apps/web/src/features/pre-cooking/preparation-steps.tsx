import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { TimingBadge } from "./timing-badge";

interface PreparationStepsProps {
	steps: PreCookingOutput["preparationSteps"];
}

export function PreparationSteps({ steps }: PreparationStepsProps) {
	if (steps.length === 0) return null;
	return (
		<section className="space-y-4" aria-labelledby="preparation-heading">
			<header className="space-y-1">
				<h2 id="preparation-heading" className="font-heading text-2xl">
					Before you cook
				</h2>
				<p className="text-sm text-muted-foreground">
					Finish these preparation steps first.
				</p>
			</header>
			<ol className="space-y-5">
				{steps.map((step, index) => (
					<li key={step.id} className="flex gap-4">
						<span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-foreground bg-mustard text-sm font-extrabold">
							{index + 1}
						</span>
						<div className="min-w-0 flex-1 space-y-2 pt-1">
							<p className="leading-relaxed font-bold">{step.instruction}</p>
							{step.timing ? (
								<div className="flex flex-wrap items-center gap-2">
									<TimingBadge level={step.timing.level} />
									{step.timing.cue ? (
										<span className="text-sm text-muted-foreground">
											{step.timing.cue}
										</span>
									) : null}
								</div>
							) : null}
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
