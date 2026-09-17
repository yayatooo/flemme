import { createFileRoute } from "@tanstack/react-router";
import { NutritionPage } from "@/features/nutrition/nutrition-page";

export const Route = createFileRoute("/app/cooking/$sessionId_/nutrition")({
	component: NutritionRoute,
});

function NutritionRoute() {
	const { sessionId } = Route.useParams();
	return <NutritionPage sessionId={sessionId} />;
}
