import { BadgeCheck } from "lucide-react";
import { ErrorState, LoadingState, PageContainer } from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	cookingSessionReadErrorMessage,
	useCookingSession,
} from "./cooking-session-query";

interface CookingSessionPageProps {
	sessionId: string;
}

export function CookingSessionPage({ sessionId }: CookingSessionPageProps) {
	const sessionQuery = useCookingSession(sessionId);

	return (
		<PageContainer>
			<div className="space-y-6">
				<header className="space-y-2">
					<Badge variant="secondary">Cooking session</Badge>
					<h1 className="font-heading text-4xl leading-none tracking-tight">
						Active cooking
					</h1>
				</header>

				{sessionQuery.isPending ? <LoadingState rows={2} /> : null}
				{sessionQuery.isError && !sessionQuery.data ? (
					<ErrorState
						title="Couldn't load cooking session"
						description={cookingSessionReadErrorMessage(sessionQuery.error)}
						onRetry={() => void sessionQuery.refetch()}
					/>
				) : null}
				{sessionQuery.data ? (
					<Card className="bg-secondary">
						<CardHeader className="space-y-3">
							<div className="grid size-12 place-items-center rounded-full border-2 border-foreground bg-success">
								<BadgeCheck className="size-6" aria-hidden="true" />
							</div>
							<CardTitle>Cooking session created</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-lg font-extrabold">
								{sessionQuery.data.selectedRecipeSnapshot.name}
							</p>
							<p className="leading-relaxed text-muted-foreground">
								Your plan and starting position are saved. Active Cooking
								controls will continue from this persisted session.
							</p>
							<p className="break-all text-xs text-muted-foreground">
								Session {sessionQuery.data.id}
							</p>
						</CardContent>
					</Card>
				) : null}
			</div>
		</PageContainer>
	);
}
