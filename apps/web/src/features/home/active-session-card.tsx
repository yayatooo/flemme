import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumableCookingSession } from "@/features/cooking-session/resumable-cooking-session-query";
import {
	type ActiveSessionSummary,
	createActiveSessionSummary,
} from "./active-session-summary";

interface ActiveSessionCardProps {
	session: ActiveSessionSummary | null;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
	if (!session) return null;

	return (
		<section aria-labelledby="active-session-heading" className="space-y-3">
			<h2 id="active-session-heading" className="font-heading text-2xl">
				Continue Cooking
			</h2>
			<Card className="bg-mustard shadow-none">
				<CardHeader className="min-w-0">
					<Badge
						variant={session.status === "paused" ? "secondary" : "outline"}
					>
						{session.status === "paused" ? "Paused" : "In progress"}
					</Badge>
					<h3 className="line-clamp-2 break-words font-heading text-2xl leading-tight">
						{session.displayName}
					</h3>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-extrabold">{session.stageLabel}</p>
						<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{session.stepLabel}
						</p>
					</div>
					<Button
						className="w-full sm:w-auto"
						render={
							<Link
								to="/app/cooking/$sessionId"
								params={{ sessionId: session.id }}
							/>
						}
					>
						Continue cooking
						<ArrowRight aria-hidden="true" />
					</Button>
				</CardContent>
			</Card>
		</section>
	);
}

export function ActiveSessionCardLoading() {
	return (
		<section className="space-y-3" aria-label="Checking saved cooking session">
			<Skeleton className="h-8 w-48 rounded-xl" />
			<Card className="space-y-4 bg-card/60 p-5 shadow-none">
				<Skeleton className="h-7 w-24 rounded-full" />
				<Skeleton className="h-8 w-4/5 rounded-xl" />
				<Skeleton className="h-5 w-3/5 rounded-lg" />
				<Skeleton className="h-12 w-full rounded-full sm:w-44" />
			</Card>
		</section>
	);
}

export function ActiveSessionError() {
	return (
		<p className="text-sm text-muted-foreground" role="status">
			Flemme couldn't check your saved cooking session. You can still start
			something new.
		</p>
	);
}

export function HomeActiveSession() {
	const resumableQuery = useResumableCookingSession();
	if (resumableQuery.isPending) return <ActiveSessionCardLoading />;
	if (resumableQuery.isError) return <ActiveSessionError />;
	if (!resumableQuery.data.session) return null;

	const summary = createActiveSessionSummary(resumableQuery.data.session);
	return summary ? (
		<ActiveSessionCard session={summary} />
	) : (
		<ActiveSessionError />
	);
}
