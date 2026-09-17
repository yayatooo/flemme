import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	cookingSessionReadErrorMessage,
	getCookingSessionDisplayName,
	useCookingSession,
} from "@/features/cooking-session/cooking-session-query";
import { NutritionCoverage } from "./nutrition-coverage";
import { NutritionError } from "./nutrition-error";
import { NutritionLoading } from "./nutrition-loading";
import { nutritionErrorMessage, useNutrition } from "./nutrition-query";
import { NutritionSummary } from "./nutrition-summary";

interface NutritionPageProps {
	sessionId: string;
}

export function NutritionPage({ sessionId }: NutritionPageProps) {
	const sessionQuery = useCookingSession(sessionId);
	const nutritionQuery = useNutrition(sessionId, sessionQuery.data);
	const displayName = sessionQuery.data
		? getCookingSessionDisplayName(sessionQuery.data)
		: undefined;

	if (sessionQuery.isPending) return <NutritionLoading />;
	if (sessionQuery.isError && !sessionQuery.data) {
		return (
			<NutritionError
				sessionId={sessionId}
				message={cookingSessionReadErrorMessage(sessionQuery.error)}
				onRetry={() => void sessionQuery.refetch()}
			/>
		);
	}
	if (!sessionQuery.data) {
		return (
			<NutritionError
				sessionId={sessionId}
				message="This cooking session could not be restored."
			/>
		);
	}

	const session = sessionQuery.data;
	if (session.session.status !== "completed") {
		const canContinueCooking =
			session.session.status === "active" ||
			session.session.status === "paused";
		return (
			<main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 sm:px-6 sm:py-8">
				<Button variant="ghost" size="sm" render={<Link to="/app" />}>
					<ArrowLeft aria-hidden="true" />
					Home
				</Button>
				<header className="space-y-2">
					<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
						Nutrition
					</p>
					<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
						{displayName}
					</h1>
				</header>
				<Card className="shadow-hard">
					<CardHeader>
						<CardTitle>Nutrition review isn't available yet</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="leading-relaxed text-muted-foreground">
							{canContinueCooking
								? "Finish the cooking session and its Completion review before opening Nutrition."
								: "This cooking session was abandoned, so it cannot generate a Nutrition review."}
						</p>
						{canContinueCooking ? (
							<Button
								className="w-full"
								size="lg"
								render={
									<Link to="/app/cooking/$sessionId" params={{ sessionId }} />
								}
							>
								Continue cooking
							</Button>
						) : null}
					</CardContent>
				</Card>
			</main>
		);
	}

	if (!session.completionSnapshot) {
		return (
			<NutritionError
				sessionId={sessionId}
				displayName={displayName}
				message="Complete the Completion review before opening Nutrition."
			/>
		);
	}

	const nutrition = session.nutritionSnapshot ?? nutritionQuery.data;
	if (!nutrition && nutritionQuery.isPending) {
		return <NutritionLoading displayName={displayName} />;
	}
	if (!nutrition && nutritionQuery.isError) {
		return (
			<NutritionError
				sessionId={sessionId}
				displayName={displayName}
				message={nutritionErrorMessage(nutritionQuery.error)}
				onRetry={() => void nutritionQuery.refetch()}
			/>
		);
	}
	if (!nutrition) {
		return (
			<NutritionError
				sessionId={sessionId}
				displayName={displayName}
				message="This completed session has no Nutrition review yet."
				onRetry={() => void nutritionQuery.refetch()}
			/>
		);
	}

	return (
		<main className="mx-auto w-full max-w-3xl space-y-8 px-5 py-6 sm:px-6 sm:py-8">
			<header className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					render={
						<Link
							to="/app/cooking/$sessionId/completion"
							params={{ sessionId }}
						/>
					}
				>
					<ArrowLeft aria-hidden="true" />
					Completion
				</Button>
				<div className="space-y-2">
					<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
						Nutrition
					</p>
					<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
						{displayName}
					</h1>
					<p className="leading-relaxed text-muted-foreground">
						A deterministic estimate from your approved plan and the ingredient
						amounts Flemme could calculate.
					</p>
				</div>
			</header>

			<NutritionSummary nutrition={nutrition} />
			<NutritionCoverage
				nutrition={nutrition}
				plannedIngredients={session.cookingPlan.ingredients}
			/>

			<section
				className="space-y-3 border-t-2 pt-6"
				aria-labelledby="favorite-boundary-title"
			>
				<div className="flex items-start gap-3">
					<Heart className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
					<div>
						<h2 id="favorite-boundary-title" className="font-heading text-xl">
							Ready for Favorite
						</h2>
						<p
							id="favorite-boundary-description"
							className="text-sm leading-relaxed text-muted-foreground"
						>
							Saving this completed meal is the next cooking phase.
						</p>
					</div>
				</div>
				<Button
					type="button"
					size="lg"
					className="w-full"
					disabled
					aria-describedby="favorite-boundary-description"
				>
					Save to favorites
					<ArrowRight aria-hidden="true" />
				</Button>
				<Button
					variant="outline"
					className="w-full"
					render={
						<Link
							to="/app/cooking/$sessionId/completion"
							params={{ sessionId }}
						/>
					}
				>
					Back to Completion
				</Button>
			</section>
		</main>
	);
}
