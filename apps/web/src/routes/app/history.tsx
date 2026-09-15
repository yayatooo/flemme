import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/app";

export const Route = createFileRoute("/app/history")({
	component: HistoryPage,
});

function HistoryPage() {
	return (
		<PageContainer>
			<h1 className="font-heading text-4xl leading-none tracking-tight">
				History
			</h1>
		</PageContainer>
	);
}
