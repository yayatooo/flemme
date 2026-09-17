import { createFileRoute } from "@tanstack/react-router";
import { CookingHistoryPage } from "@/features/history";

export const Route = createFileRoute("/app/history")({
	component: CookingHistoryPage,
});
