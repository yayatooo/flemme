import { createFileRoute } from "@tanstack/react-router";
import { RecommendationPage } from "@/features/recommendation";

export const Route = createFileRoute("/app/recommendation")({
	component: RecommendationPage,
});
