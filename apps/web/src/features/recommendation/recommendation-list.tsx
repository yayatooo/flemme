import type { CookingRecommendation } from "@flemme/agent/cooking-recommendation-output";
import { RecommendationCard } from "./recommendation-card";

interface RecommendationListProps {
	recommendations: readonly CookingRecommendation[];
	onSelect: (recommendation: CookingRecommendation) => void;
}

export function RecommendationList({
	recommendations,
	onSelect,
}: RecommendationListProps) {
	return (
		<div className="grid gap-4">
			{recommendations.map((recommendation) => (
				<RecommendationCard
					key={recommendation.name}
					recommendation={recommendation}
					onSelect={onSelect}
				/>
			))}
		</div>
	);
}
