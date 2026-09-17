import type { FavoriteResponse } from "@flemme/contracts/favorite";
import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CircleAlert,
	Heart,
	LoaderCircle,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	completedMealNutritionLabel,
	formatCompletedMealDate,
} from "@/features/cooking-session/completed-meal-format";
import {
	favoriteDeleteErrorMessage,
	useDeleteFavoriteMutation,
} from "./favorite-mutations";

export type FavoriteRemoveState =
	| { status: "idle" }
	| { status: "pending" }
	| { status: "error"; message: string };

interface FavoriteCardViewProps {
	favorite: FavoriteResponse;
	removeState: FavoriteRemoveState;
	onRemove: () => void;
}

export function FavoriteCardView({
	favorite,
	removeState,
	onRemove,
}: FavoriteCardViewProps) {
	const nutritionLabel = completedMealNutritionLabel(favorite.nutrition);
	const isRemoving = removeState.status === "pending";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="line-clamp-2 break-words pr-2 text-2xl">
					{favorite.displayName}
				</CardTitle>
				<CardAction>
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
				</CardAction>
				<time
					dateTime={favorite.completedAt}
					className="text-sm font-semibold text-muted-foreground"
				>
					{formatCompletedMealDate(favorite.completedAt)}
				</time>
			</CardHeader>

			{favorite.completionSummary || nutritionLabel ? (
				<CardContent className="space-y-3">
					{favorite.completionSummary ? (
						<p className="line-clamp-3 leading-relaxed text-muted-foreground">
							{favorite.completionSummary.description}
						</p>
					) : null}
					{nutritionLabel ? (
						<Badge
							variant={
								favorite.nutrition?.status === "unavailable"
									? "secondary"
									: "outline"
							}
						>
							{nutritionLabel}
						</Badge>
					) : null}
				</CardContent>
			) : null}

			{removeState.status === "error" ? (
				<CardContent>
					<div
						className="space-y-2 rounded-2xl border-2 border-destructive/60 bg-destructive/10 p-3 text-sm"
						role="alert"
					>
						<div className="flex items-start gap-2">
							<CircleAlert
								className="mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<p>{removeState.message}</p>
						</div>
						<Button type="button" variant="ghost" size="sm" onClick={onRemove}>
							Try removing again
						</Button>
					</div>
				</CardContent>
			) : null}

			<CardFooter className="gap-2">
				<Button
					className="min-w-0 flex-1"
					render={
						<Link
							to="/app/cooking/$sessionId/completion"
							params={{ sessionId: favorite.cookingSessionId }}
						/>
					}
				>
					View meal
					<ArrowRight aria-hidden="true" />
				</Button>
				{isRemoving ? (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled
						aria-label="Removing favorite"
					>
						<LoaderCircle className="animate-spin" aria-hidden="true" />
					</Button>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Options for ${favorite.displayName}`}
								/>
							}
						>
							<MoreHorizontal aria-hidden="true" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem className="text-destructive" onClick={onRemove}>
								<Trash2 aria-hidden="true" />
								Remove from favorites
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</CardFooter>
		</Card>
	);
}

interface FavoriteCardProps {
	favorite: FavoriteResponse;
}

export function FavoriteCard({ favorite }: FavoriteCardProps) {
	const remove = useDeleteFavoriteMutation(favorite);
	const removeState: FavoriteRemoveState = remove.isPending
		? { status: "pending" }
		: remove.isError
			? { status: "error", message: favoriteDeleteErrorMessage(remove.error) }
			: { status: "idle" };

	return (
		<FavoriteCardView
			favorite={favorite}
			removeState={removeState}
			onRemove={() => remove.mutate()}
		/>
	);
}
