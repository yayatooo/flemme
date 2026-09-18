import type { ActiveCookingAction } from "@flemme/agent/active-cooking-output";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	getCookingSessionDisplayName,
	useCookingSession,
} from "@/features/cooking-session/cooking-session-query";
import { AbandonCookingDialog } from "./abandon-cooking-dialog";
import { ActiveCookingError } from "./active-cooking-error";
import { ActiveCookingLoading } from "./active-cooking-loading";
import {
	activeCookingAssistantErrorMessage,
	activeCookingMutationErrorMessage,
	type CookingAssistantResult,
	cookingSessionRenameErrorMessage,
	useCookingAssistantMutation,
	useCookingProgressMutation,
	useRenameCookingSessionMutation,
} from "./active-cooking-mutations";
import {
	activeCookingReadErrorMessage,
	resolveCookingPosition,
} from "./active-cooking-query";
import { CookingAssistant } from "./cooking-assistant";
import { CookingControls } from "./cooking-controls";
import { CurrentStepCard } from "./current-step-card";
import { PauseCookingDialog } from "./pause-cooking-dialog";
import { RecordChangeDialog } from "./record-change-dialog";
import { RenameDishDialog } from "./rename-dish-dialog";
import { ClosedSessionStatus, PausedSessionStatus } from "./session-status";
import { StageProgress } from "./stage-progress";

interface ActiveCookingPageProps {
	sessionId: string;
}

export function ActiveCookingPage({ sessionId }: ActiveCookingPageProps) {
	const navigate = useNavigate();
	const sessionQuery = useCookingSession(sessionId);
	const progress = useCookingProgressMutation(sessionId);
	const assistant = useCookingAssistantMutation(sessionId);
	const rename = useRenameCookingSessionMutation(sessionId);
	const [assistantResult, setAssistantResult] =
		useState<CookingAssistantResult | null>(null);
	const [abandonOpen, setAbandonOpen] = useState(false);
	const [renameOpen, setRenameOpen] = useState(false);
	const [pendingAbandonActions, setPendingAbandonActions] = useState<
		ActiveCookingAction[] | null
	>(null);

	if (sessionQuery.isPending) return <ActiveCookingLoading />;
	if (sessionQuery.isError && !sessionQuery.data) {
		return (
			<ActiveCookingError
				message={activeCookingReadErrorMessage(sessionQuery.error)}
				onRetry={() => void sessionQuery.refetch()}
			/>
		);
	}
	if (!sessionQuery.data) {
		return (
			<ActiveCookingError message="This cooking session could not be restored safely." />
		);
	}

	const persisted = sessionQuery.data;
	const resolved = resolveCookingPosition(persisted);
	if (!resolved.ok) {
		return <ActiveCookingError message={resolved.message} />;
	}
	const position = resolved.position;

	async function askFlemme(message: string) {
		const result = await assistant.ask(message);
		if (!result) return false;
		setAssistantResult(result);
		if (result.session?.session.status === "completed") {
			void navigate({
				to: "/app/cooking/$sessionId/completion",
				params: { sessionId },
			});
		}
		return true;
	}
	const lifecyclePending =
		progress.isPending || assistant.isPending || rename.isPending;
	const progressError = progress.error
		? activeCookingMutationErrorMessage(progress.error)
		: undefined;
	const assistantError = assistant.error
		? activeCookingAssistantErrorMessage(assistant.error)
		: undefined;
	const renameError = rename.error
		? cookingSessionRenameErrorMessage(rename.error)
		: undefined;

	function requestAssistantAbandon(actions: ActiveCookingAction[]) {
		setPendingAbandonActions(actions);
		setAbandonOpen(true);
	}

	function changeAbandonOpen(open: boolean) {
		setAbandonOpen(open);
		if (!open) setPendingAbandonActions(null);
	}

	function openRenameDialog() {
		rename.reset();
		setRenameOpen(true);
	}

	function changeRenameOpen(open: boolean) {
		if (rename.isPending) return;
		setRenameOpen(open);
		if (!open) rename.reset();
	}

	async function saveName(customName: string | null) {
		return rename.submit(customName);
	}

	async function advanceCooking() {
		const updated = await progress.submitForResult({ type: "advance" });
		if (updated?.session.status === "completed") {
			void navigate({
				to: "/app/cooking/$sessionId/completion",
				params: { sessionId },
			});
		}
	}

	async function confirmAbandon() {
		const saved = await progress.submit(
			pendingAbandonActions
				? { type: "apply-assistant-actions", actions: pendingAbandonActions }
				: { type: "abandon" },
		);
		if (saved) setPendingAbandonActions(null);
		return saved;
	}

	const closedState =
		persisted.session.status === "completed"
			? "completed"
			: persisted.session.status === "abandoned"
				? "abandoned"
				: position.isCompletionBoundaryReached
					? "boundary"
					: undefined;
	const displayName = getCookingSessionDisplayName(persisted);

	return (
		<div className="flex min-h-dvh flex-col">
			<header className="sticky top-0 z-30 rounded-b-3xl bg-card/95 px-3 pt-3 pb-4 shadow-card backdrop-blur">
				<div className="mb-3 flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon-sm"
						render={<Link to="/app" aria-label="Back to Home" />}
					>
						<ArrowLeft aria-hidden="true" />
					</Button>
					<p className="line-clamp-2 min-w-0 flex-1 break-words font-heading text-xl leading-tight">
						{displayName}
					</p>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label="Session options"
								/>
							}
						>
							<MoreHorizontal aria-hidden="true" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								disabled={lifecyclePending}
								onClick={openRenameDialog}
							>
								<Pencil aria-hidden="true" />
								Rename dish
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<StageProgress
					stageTitle={position.stage.title}
					stageIndex={position.stageIndex}
					totalStages={position.totalStages}
				/>
			</header>

			{renameOpen ? (
				<RenameDishDialog
					open
					originalName={persisted.selectedRecipeSnapshot.name}
					customName={persisted.customName}
					isPending={rename.isPending}
					errorMessage={renameError}
					onOpenChange={changeRenameOpen}
					onSave={saveName}
				/>
			) : null}

			<main className="flex flex-1 flex-col gap-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:gap-6 sm:pt-6">
				{closedState ? (
					<ClosedSessionStatus state={closedState} />
				) : (
					<>
						<CurrentStepCard
							step={position.step}
							stepNumber={position.overallStepIndex + 1}
							totalSteps={position.totalSteps}
						/>

						{persisted.session.status === "active" ? (
							<CookingControls
								canGoPrevious={position.previous !== undefined}
								isFinalStep={position.isFinalStep}
								isPending={lifecyclePending}
								onPrevious={() => void progress.submit({ type: "previous" })}
								onAdvance={() => void advanceCooking()}
							/>
						) : null}
						{persisted.session.status === "paused" ? (
							<PausedSessionStatus
								pauseReason={persisted.session.pauseReason}
								isPending={progress.isPending}
								onResume={() => void progress.submit({ type: "resume" })}
							/>
						) : null}

						{progressError ? (
							<p
								className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive"
								role="alert"
							>
								{progressError}
							</p>
						) : null}

						<CookingAssistant
							disabled={progress.isPending}
							isPending={assistant.isPending}
							result={assistantResult}
							errorMessage={assistantError}
							onAsk={askFlemme}
							onAbandonRequested={requestAssistantAbandon}
						/>

						<section
							className="space-y-3 rounded-3xl bg-muted/45 p-4 shadow-card"
							aria-labelledby="session-options-title"
						>
							<h2
								id="session-options-title"
								className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
							>
								Session options
							</h2>
							<div className="flex flex-wrap gap-3">
								{persisted.session.status === "active" ? (
									<PauseCookingDialog
										disabled={lifecyclePending}
										isPending={progress.isPending}
										onPause={(reason) =>
											progress.submit({ type: "pause", reason })
										}
									/>
								) : null}
								<RecordChangeDialog
									currentStepId={position.step.id}
									disabled={lifecyclePending}
									isPending={progress.isPending}
									onRecord={(change) =>
										progress.submit({ type: "record-change", change })
									}
								/>
								<AbandonCookingDialog
									open={abandonOpen}
									onOpenChange={changeAbandonOpen}
									disabled={lifecyclePending}
									isPending={progress.isPending}
									onConfirm={confirmAbandon}
								/>
							</div>
						</section>
					</>
				)}
			</main>
		</div>
	);
}
