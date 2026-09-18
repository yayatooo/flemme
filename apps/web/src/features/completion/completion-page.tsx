import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	cookingSessionReadErrorMessage,
	getCookingSessionDisplayName,
	useCookingSession,
} from "@/features/cooking-session/cooking-session-query";
import { CompletionChanges } from "./completion-changes";
import { CompletionError } from "./completion-error";
import { CompletionLoading } from "./completion-loading";
import { CompletionNotes } from "./completion-notes";
import { completionErrorMessage, useCompletion } from "./completion-query";
import { CompletionSummary } from "./completion-summary";

interface CompletionPageProps {
	sessionId: string;
}

export function CompletionPage({ sessionId }: CompletionPageProps) {
	const sessionQuery = useCookingSession(sessionId);
	const completionQuery = useCompletion(sessionId, sessionQuery.data);
	const displayName = sessionQuery.data
		? getCookingSessionDisplayName(sessionQuery.data)
		: undefined;

	if (sessionQuery.isPending) return <CompletionLoading />;
	if (sessionQuery.isError && !sessionQuery.data) {
		return (
			<CompletionError
				message={cookingSessionReadErrorMessage(sessionQuery.error)}
				onRetry={() => void sessionQuery.refetch()}
			/>
		);
	}
	if (!sessionQuery.data) {
		return (
			<CompletionError message="This cooking session could not be restored." />
		);
	}

	const session = sessionQuery.data;
	if (session.session.status !== "completed") {
		const canContinueCooking =
			session.session.status === "active" ||
			session.session.status === "paused";
		return (
			<main className="space-y-6 py-6 sm:py-8">
				<Button variant="ghost" size="sm" render={<Link to="/app" />}>
					<ArrowLeft aria-hidden="true" />
					Home
				</Button>
				<header className="space-y-2">
					<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
						Completion
					</p>
					<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
						{displayName}
					</h1>
				</header>
				<Card className="shadow-hard">
					<CardHeader>
						<CardTitle>Completion review isn't available yet</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="leading-relaxed text-muted-foreground">
							{canContinueCooking
								? "Finish the cooking session before opening its Completion review."
								: "This cooking session was abandoned, so it cannot generate a Completion review."}
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

	const completion = session.completionSnapshot ?? completionQuery.data;
	if (!completion && completionQuery.isPending) {
		return <CompletionLoading displayName={displayName} />;
	}
	if (!completion && completionQuery.isError) {
		return (
			<CompletionError
				displayName={displayName}
				message={completionErrorMessage(completionQuery.error)}
				onRetry={() => void completionQuery.refetch()}
			/>
		);
	}
	if (!completion) {
		return (
			<CompletionError
				displayName={displayName}
				message="This completed session has no Completion review yet."
				onRetry={() => void completionQuery.refetch()}
			/>
		);
	}

	return (
		<main className="space-y-8 py-6 sm:py-8">
			<header className="space-y-4">
				<Button variant="ghost" size="sm" render={<Link to="/app" />}>
					<ArrowLeft aria-hidden="true" />
					Home
				</Button>
				<div className="space-y-2">
					<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
						Completion
					</p>
					<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
						{displayName}
					</h1>
					<p className="leading-relaxed text-muted-foreground">
						Cooking complete. Review what happened, then continue to Nutrition.
					</p>
				</div>
			</header>

			<CompletionSummary completion={completion} />
			<CompletionChanges changes={session.session.changes} />
			<CompletionNotes notes={completion.notes} />

			<section
				className="space-y-3 border-t-2 pt-6"
				aria-labelledby="nutrition-boundary-title"
			>
				<div className="flex items-start gap-3">
					<CheckCircle2 className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
					<div>
						<h2 id="nutrition-boundary-title" className="font-heading text-xl">
							Ready for Nutrition
						</h2>
						<p
							id="nutrition-boundary-description"
							className="text-sm leading-relaxed text-muted-foreground"
						>
							Nutrition review is the next cooking phase.
						</p>
					</div>
				</div>
				<Button
					size="lg"
					className="w-full"
					aria-describedby="nutrition-boundary-description"
					render={
						<Link
							to="/app/cooking/$sessionId/nutrition"
							params={{ sessionId }}
						/>
					}
				>
					Continue to nutrition
					<ArrowRight aria-hidden="true" />
				</Button>
				<Button
					variant="outline"
					className="w-full"
					render={<Link to="/app" />}
				>
					Back home
				</Button>
			</section>
		</main>
	);
}
