import type { CookingHistoryItem } from "@flemme/contracts/cooking-history";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	completedMealNutritionLabel,
	formatCompletedMealDate,
} from "../cooking-session/completed-meal-format";

interface CookingHistoryCardProps {
	item: CookingHistoryItem;
}

export function CookingHistoryCard({ item }: CookingHistoryCardProps) {
	const nutritionLabel = completedMealNutritionLabel(item.nutrition);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="line-clamp-2 break-words pr-2 text-2xl">
					{item.displayName}
				</CardTitle>
				<CardAction>
					{item.isFavorite ? (
						<span
							role="img"
							aria-label="Saved favorite"
							className="grid size-9 place-items-center rounded-full border-2 border-foreground bg-primary"
						>
							<Heart
								className="size-5 fill-current"
								strokeWidth={2.5}
								aria-hidden="true"
							/>
						</span>
					) : null}
				</CardAction>
				<time
					dateTime={item.completedAt}
					className="text-sm font-semibold text-muted-foreground"
				>
					{formatCompletedMealDate(item.completedAt)}
				</time>
			</CardHeader>

			{item.completionSummary || nutritionLabel ? (
				<CardContent className="space-y-3">
					{item.completionSummary ? (
						<p className="line-clamp-3 leading-relaxed text-muted-foreground">
							{item.completionSummary.description}
						</p>
					) : null}
					{nutritionLabel ? (
						<Badge
							variant={
								item.nutrition?.status === "unavailable"
									? "secondary"
									: "outline"
							}
						>
							{nutritionLabel}
						</Badge>
					) : null}
				</CardContent>
			) : null}

			<CardFooter className="justify-end">
				<Button
					className="w-full sm:w-auto"
					render={
						<Link
							to="/app/cooking/$sessionId/completion"
							params={{ sessionId: item.sessionId }}
						/>
					}
				>
					View meal
					<ArrowRight aria-hidden="true" />
				</Button>
			</CardFooter>
		</Card>
	);
}
