import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, PageContainer } from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateCookingSessionMutation } from "@/features/cooking-session/cooking-session-query";
import { CreateCookingSessionAction } from "@/features/cooking-session/create-cooking-session";
import {
	useRecommendationFlow,
	useRecommendationSelection,
} from "@/features/recommendation/recommendation-query";
import { CookingStagesPreview } from "./cooking-stages-preview";
import { EquipmentRequirements } from "./equipment-requirements";
import { IngredientRequirements } from "./ingredient-requirements";
import { PreCookingError } from "./pre-cooking-error";
import { PreCookingLoading } from "./pre-cooking-loading";
import {
	usePreCookingFlow,
	usePreCookingHandoff,
	usePreCookingMutation,
} from "./pre-cooking-query";
import { PreCookingSummary } from "./pre-cooking-summary";
import { PreparationSteps } from "./preparation-steps";

export function PreCookingPage() {
	const navigate = useNavigate();
	const selection = useRecommendationSelection().data;
	const recommendationFlow = useRecommendationFlow().data;
	const flow = usePreCookingFlow().data;
	const handoff = usePreCookingHandoff().data;
	const preCooking = usePreCookingMutation();
	const createSession = useCreateCookingSessionMutation();

	if (!selection || !flow) {
		return (
			<PageContainer className="pt-4 sm:pt-6">
				<EmptyState
					className="border-transparent bg-card shadow-card"
					iconClassName="rounded-2xl border-transparent"
					title="No cooking plan to review"
					description="Return to your recommendations and select a recipe."
					action={
						<Button render={<Link to="/app/recommendation" />}>
							Back to recommendations
						</Button>
					}
				/>
			</PageContainer>
		);
	}

	const recommendationSnapshot =
		recommendationFlow?.status === "success" &&
		recommendationFlow.result.type === "recommendations" &&
		handoff?.request === recommendationFlow.request &&
		recommendationFlow.result.recommendations.includes(handoff.selectedRecipe)
			? recommendationFlow.result
			: null;
	const creationMatchesHandoff =
		handoff &&
		createSession.state &&
		createSession.state.input.handoff.request === handoff.request &&
		createSession.state.input.handoff.selectedRecipe ===
			handoff.selectedRecipe &&
		createSession.state.input.handoff.plan === handoff.plan;
	const creationPending =
		Boolean(creationMatchesHandoff) &&
		(createSession.state?.status === "pending" || createSession.isPending);
	const sessionCreated =
		Boolean(creationMatchesHandoff) &&
		createSession.state?.status === "success";
	const creationError =
		creationMatchesHandoff && createSession.state?.status === "error"
			? createSession.state.message
			: null;

	function startCooking() {
		if (!handoff || !recommendationSnapshot) return;
		const submission = createSession.submit({
			handoff,
			recommendationSnapshot,
		});
		if (!submission) return;
		void submission
			.then((session) =>
				navigate({
					to: "/app/cooking/$sessionId",
					params: { sessionId: session.id },
				}),
			)
			.catch(() => undefined);
	}

	return (
		<PageContainer className="pt-4 sm:pt-6">
			<div className="space-y-5 sm:space-y-6">
				<header className="space-y-4 rounded-3xl bg-mustard p-5 shadow-card">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="border-transparent bg-card/75 shadow-none hover:border-transparent hover:bg-card"
						onClick={() => void navigate({ to: "/app/recommendation" })}
					>
						<ArrowLeft aria-hidden="true" />
						Recommendations
					</Button>
					<div className="space-y-2">
						<Badge variant="secondary">Pre-cooking</Badge>
						<h1 className="font-heading text-3xl leading-none tracking-tight break-words sm:text-4xl">
							{selection.selectedRecipe.name}
						</h1>
					</div>
				</header>

				{flow.status === "loading" ? <PreCookingLoading /> : null}
				{flow.status === "error" ? (
					<PreCookingError
						message={flow.message}
						onRetry={() => {
							const submission = preCooking.submit(flow.selection);
							if (submission) void submission.catch(() => undefined);
						}}
						onBack={() => void navigate({ to: "/app/recommendation" })}
					/>
				) : null}
				{flow.status === "success" ? (
					<>
						<PreCookingSummary summary={flow.plan.preparationSummary} />
						<IngredientRequirements ingredients={flow.plan.ingredients} />
						<EquipmentRequirements equipment={flow.plan.equipment} />
						<PreparationSteps steps={flow.plan.preparationSteps} />
						<CookingStagesPreview stages={flow.plan.cookingStages} />

						<section className="space-y-3 rounded-3xl bg-primary/15 p-5 shadow-card">
							<div className="space-y-1">
								<h2 className="font-heading text-2xl">Ready to cook?</h2>
								<p className="text-sm leading-relaxed text-muted-foreground">
									Review the plan, then confirm when you are ready to begin.
								</p>
							</div>
							<CreateCookingSessionAction
								isPending={creationPending}
								isCreated={sessionCreated}
								disabled={!handoff || !recommendationSnapshot}
								errorMessage={creationError}
								onStart={startCooking}
							/>
							{!handoff || !recommendationSnapshot ? (
								<p className="text-sm font-bold text-destructive" role="alert">
									This plan can no longer be started. Return to recommendations
									and select the recipe again.
								</p>
							) : null}
						</section>
					</>
				) : null}
			</div>
		</PageContainer>
	);
}
