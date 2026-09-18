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
		<PageContainer className="pt-4 sm:pt-6">
			<div className="space-y-5 sm:space-y-6">
				<header className="space-y-3 rounded-3xl bg-lavender p-5 shadow-card">
					<Button
						variant="ghost"
						size="sm"
						className="border-transparent bg-card/75 shadow-none hover:border-transparent hover:bg-card"
						render={<Link to="/app" />}
					>
						<ArrowLeft aria-hidden="true" />
						Home
					</Button>
					<h1 className="font-heading text-3xl leading-none tracking-tight sm:text-4xl">
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
						className="border-transparent bg-card shadow-card"
						iconClassName="rounded-2xl border-transparent"
						title="Start with a cooking request"
						description="Tell Flemme what you feel like cooking from Home."
						action={<Button render={<Link to="/app" />}>Go to Home</Button>}
					/>
				) : null}
				{flow?.status === "loading" ? <RecommendationLoading /> : null}
				{flow?.status === "error" ? (
					<div className="space-y-3">
						<ErrorState
							className="border-destructive/40 bg-card shadow-card"
							iconClassName="rounded-2xl border-transparent"
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
