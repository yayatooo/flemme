import { createFileRoute } from "@tanstack/react-router";
import { CookingSessionPage } from "@/features/cooking-session";

export const Route = createFileRoute("/app/cooking/$sessionId")({
	component: CookingSessionRoute,
});

function CookingSessionRoute() {
	const { sessionId } = Route.useParams();
	return <CookingSessionPage sessionId={sessionId} />;
}
