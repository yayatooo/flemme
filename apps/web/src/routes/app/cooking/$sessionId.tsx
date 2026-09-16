import { createFileRoute } from "@tanstack/react-router";
import { ActiveCookingPage } from "@/features/active-cooking";

export const Route = createFileRoute("/app/cooking/$sessionId")({
	component: CookingSessionRoute,
});

function CookingSessionRoute() {
	const { sessionId } = Route.useParams();
	return <ActiveCookingPage sessionId={sessionId} />;
}
