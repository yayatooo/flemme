import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/auth-query";
import { getUserDisplayName } from "@/auth/user-display-name";
import { PageContainer } from "@/components/app";
import {
	useRecommendationFlow,
	useRecommendationMutation,
} from "@/features/recommendation";
import { ActiveSessionCard } from "./active-session-card";
import { CookingPrompt } from "./cooking-prompt";
import { HomeGreeting } from "./home-greeting";
import { KitchenShortcut } from "./kitchen-shortcut";
import { QuickStart } from "./quick-start";
import { RecentCooking } from "./recent-cooking";

export function HomePage() {
	const auth = useAuth();
	const navigate = useNavigate();
	const flow = useRecommendationFlow().data;
	const recommendation = useRecommendationMutation();
	const [request, setRequest] = useState(flow?.request ?? "");
	const displayName = getUserDisplayName(auth.user);

	async function submitRequest(currentRequest: string) {
		const submission = recommendation.submit(currentRequest);
		if (!submission) return;
		await navigate({ to: "/app/recommendation" });
		await submission.catch(() => undefined);
	}

	return (
		<PageContainer>
			<div className="space-y-8">
				<HomeGreeting displayName={displayName} />
				<CookingPrompt
					request={request}
					onRequestChange={setRequest}
					onSubmit={submitRequest}
					isSubmitting={recommendation.isPending}
				/>
				<QuickStart selectedRequest={request} onSelect={setRequest} />
				<ActiveSessionCard session={null} />
				<KitchenShortcut />
				<RecentCooking items={[]} />
			</div>
		</PageContainer>
	);
}
