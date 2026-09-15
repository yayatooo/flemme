import type { CookingRecommendation } from "@flemme/agent/cooking-recommendation-output";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, ErrorState, PageContainer } from "@/components/app";
import { Button } from "@/components/ui/button";
import { usePreCookingMutation } from "@/features/pre-cooking/pre-cooking-query";
import { RecommendationClarification } from "./recommendation-clarification";
import { RecommendationNoViable } from "./recommendation-empty";
import { RecommendationList } from "./recommendation-list";
import { RecommendationLoading } from "./recommendation-loading";
import {
	appendClarificationResponse,
	preserveSelectedRecommendation,
	useRecommendationFlow,
	useRecommendationMutation,
} from "./recommendation-query";

export function RecommendationPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const flow = useRecommendationFlow().data;
	const recommendation = useRecommendationMutation();
	const preCooking = usePreCookingMutation();

	function runRequest(request: string) {
		const submission = recommendation.submit(request);
		if (submission) void submission.catch(() => undefined);
	}

	function selectRecipe(recipe: CookingRecommendation) {
		if (flow?.status !== "success") return;
		const selection = preserveSelectedRecommendation(
			queryClient,
			flow.request,
			recipe,
		);
		const submission = preCooking.submit(selection);
		if (submission) void submission.catch(() => undefined);
		void navigate({ to: "/app/pre-cooking" });
	}

	return (
		<PageContainer>
			<div className="space-y-6">
				<header className="space-y-3">
					<Button variant="ghost" size="sm" render={<Link to="/app" />}>
						<ArrowLeft aria-hidden="true" />
						Home
					</Button>
					<h1 className="font-heading text-4xl leading-none tracking-tight">
						Recommendations
					</h1>
					{flow?.request ? (
						<p className="break-words text-sm leading-relaxed text-muted-foreground">
							“{flow.request}”
						</p>
					) : null}
				</header>

				{!flow ? (
					<EmptyState
						title="Start with a cooking request"
						description="Tell Flemme what you feel like cooking from Home."
						action={<Button render={<Link to="/app" />}>Go to Home</Button>}
					/>
				) : null}
				{flow?.status === "loading" ? <RecommendationLoading /> : null}
				{flow?.status === "error" ? (
					<div className="space-y-3">
						<ErrorState
							title="Couldn't prepare recommendations"
							description={flow.message}
							onRetry={() => runRequest(flow.request)}
						/>
						<Button variant="ghost" render={<Link to="/app" />}>
							<ArrowLeft aria-hidden="true" />
							Adjust request
						</Button>
					</div>
				) : null}
				{flow?.status === "success" &&
				flow.result.type === "recommendations" ? (
					<RecommendationList
						recommendations={flow.result.recommendations}
						onSelect={selectRecipe}
					/>
				) : null}
				{flow?.status === "success" && flow.result.type === "clarification" ? (
					<RecommendationClarification
						question={flow.result.question}
						reason={flow.result.reason}
						onAnswer={(answer) =>
							runRequest(appendClarificationResponse(flow.request, answer))
						}
					/>
				) : null}
				{flow?.status === "success" &&
				flow.result.type === "no_viable_recommendation" ? (
					<RecommendationNoViable
						reason={flow.result.reason}
						constraints={flow.result.constraints}
						onAdjustRequest={() => void navigate({ to: "/app" })}
						onCheckInventory={() => void navigate({ to: "/app/inventory" })}
					/>
				) : null}
			</div>
		</PageContainer>
	);
}
