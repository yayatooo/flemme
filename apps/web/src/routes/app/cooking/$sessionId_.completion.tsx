import { createFileRoute } from "@tanstack/react-router";
import { CompletionPage } from "@/features/completion/completion-page";

export const Route = createFileRoute("/app/cooking/$sessionId_/completion")({
	component: CompletionRoute,
});

function CompletionRoute() {
	const { sessionId } = Route.useParams();
	return <CompletionPage sessionId={sessionId} />;
}
