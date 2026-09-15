import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { ChevronDown } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TimingBadge } from "./timing-badge";

interface CookingStagesPreviewProps {
	stages: PreCookingOutput["cookingStages"];
}

export function CookingStagesPreview({ stages }: CookingStagesPreviewProps) {
	return (
		<section className="space-y-4" aria-labelledby="cooking-plan-heading">
			<header className="space-y-1">
				<h2 id="cooking-plan-heading" className="font-heading text-2xl">
					Cooking plan
				</h2>
				<p className="text-sm text-muted-foreground">
					Preview each stage without starting the cooking session.
				</p>
			</header>
			<div className="space-y-3">
				{stages.map((stage, stageIndex) => (
					<Collapsible key={stage.id}>
						<div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card">
							<CollapsibleTrigger className="group flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/70">
								<span className="font-heading text-xl text-primary">
									{String(stageIndex + 1).padStart(2, "0")}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block font-extrabold break-words">
										{stage.title}
									</span>
									<span className="block text-sm text-muted-foreground">
										{stage.steps.length}{" "}
										{stage.steps.length === 1 ? "step" : "steps"}
									</span>
								</span>
								<ChevronDown
									className="size-5 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
									aria-hidden="true"
								/>
							</CollapsibleTrigger>
							<CollapsibleContent className="border-t-2 border-foreground bg-muted/35 px-4 py-4">
								<ol className="space-y-4">
									{stage.steps.map((step, stepIndex) => (
										<li key={step.id} className="flex gap-3">
											<span className="shrink-0 text-sm font-extrabold text-muted-foreground">
												{stepIndex + 1}.
											</span>
											<div className="min-w-0 flex-1 space-y-2">
												<p className="leading-relaxed">{step.instruction}</p>
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
							</CollapsibleContent>
						</div>
					</Collapsible>
				))}
			</div>
		</section>
	);
}
