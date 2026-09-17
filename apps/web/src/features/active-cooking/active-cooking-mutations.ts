import type {
	ActiveCookingChange,
	ActiveCookingPauseReason,
	ActiveCookingSession,
} from "@flemme/agent/active-cooking-input";
import {
	type ActiveCookingAction,
	type ActiveCookingOutput,
	ActiveCookingOutputSchema,
} from "@flemme/agent/active-cooking-output";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type UpdateCookingSessionRequest,
	UpdateCookingSessionRequestSchema,
} from "@flemme/contracts/cooking-session";
import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import { resolveCookingPosition } from "./active-cooking-query";

export type CookingProgressCommand =
	| { type: "advance" }
	| { type: "previous" }
	| { type: "pause"; reason: ActiveCookingPauseReason }
	| { type: "resume" }
	| { type: "record-change"; change: ActiveCookingChange }
	| { type: "abandon" }
	| { type: "apply-assistant-actions"; actions: ActiveCookingAction[] };

export interface PreparedAssistantActions {
	session: ActiveCookingSession | null;
	requiresAbandonConfirmation: boolean;
}

export interface CookingAssistantResult {
	output: ActiveCookingOutput;
	requiresAbandonConfirmation: boolean;
	session?: CookingSessionResponse;
	actionError?: string;
}

function mutableProgressOf(session: ActiveCookingSession) {
	return {
		currentStageId: session.currentStageId,
		currentStepId: session.currentStepId,
		completedStepIds: session.completedStepIds,
		changes: session.changes,
	};
}

function requireMutableSession(session: ActiveCookingSession) {
	if (session.status === "completed" || session.status === "abandoned") {
		throw new Error("This cooking session can no longer be changed.");
	}
}

export function buildCookingSessionProgress(
	persisted: CookingSessionResponse,
	command: CookingProgressCommand,
): ActiveCookingSession {
	const session = persisted.session;
	requireMutableSession(session);

	if (command.type === "apply-assistant-actions") {
		const prepared = prepareAssistantActions(persisted, command.actions, true);
		if (!prepared.session) {
			throw new Error("The assistant did not propose a session change.");
		}
		return prepared.session;
	}

	if (command.type === "abandon") {
		return { status: "abandoned", ...mutableProgressOf(session) };
	}

	if (command.type === "pause") {
		if (session.status !== "active") {
			throw new Error("Only active cooking can be paused.");
		}
		return {
			status: "paused",
			pauseReason: command.reason,
			...mutableProgressOf(session),
		};
	}

	if (command.type === "resume") {
		if (session.status !== "paused") {
			throw new Error("Only paused cooking can be resumed.");
		}
		return { status: "active", ...mutableProgressOf(session) };
	}

	if (command.type === "record-change") {
		return {
			...(session.status === "paused"
				? { status: "paused" as const, pauseReason: session.pauseReason }
				: { status: "active" as const }),
			...mutableProgressOf(session),
			changes: [...session.changes, command.change],
		};
	}

	if (session.status !== "active") {
		throw new Error("Resume cooking before changing steps.");
	}
	const resolved = resolveCookingPosition(persisted);
	if (!resolved.ok) throw new Error(resolved.message);

	if (command.type === "previous") {
		if (!resolved.position.previous) {
			throw new Error("You are already at the first cooking step.");
		}
		return {
			status: "active",
			...mutableProgressOf(session),
			currentStageId: resolved.position.previous.stageId,
			currentStepId: resolved.position.previous.stepId,
		};
	}

	if (resolved.position.isCompletionBoundaryReached) {
		throw new Error("All cooking steps are already complete.");
	}
	const completedStepIds = session.completedStepIds.includes(
		resolved.position.step.id,
	)
		? session.completedStepIds
		: [...session.completedStepIds, resolved.position.step.id];

	return {
		status: resolved.position.isFinalStep ? "completed" : "active",
		...mutableProgressOf(session),
		currentStageId: resolved.position.next?.stageId ?? session.currentStageId,
		currentStepId: resolved.position.next?.stepId ?? session.currentStepId,
		completedStepIds,
	};
}

export function prepareAssistantActions(
	persisted: CookingSessionResponse,
	actions: ActiveCookingAction[],
	allowAbandon = false,
): PreparedAssistantActions {
	if (actions.length === 0) {
		return { session: null, requiresAbandonConfirmation: false };
	}

	const nonChangeActions = actions.filter(
		(action) => action.type !== "record-change",
	);
	if (nonChangeActions.length > 1) {
		throw new Error("Flemme proposed conflicting cooking actions.");
	}
	const primaryAction = nonChangeActions[0];
	if (primaryAction?.type === "clarify") {
		if (actions.length > 1) {
			throw new Error("A clarification cannot change the cooking session.");
		}
		return { session: null, requiresAbandonConfirmation: false };
	}
	if (primaryAction?.type === "abandon-cooking" && !allowAbandon) {
		return { session: null, requiresAbandonConfirmation: true };
	}

	let current = persisted;
	for (const action of actions) {
		if (action.type !== "record-change") continue;
		current = {
			...current,
			session: buildCookingSessionProgress(current, {
				type: "record-change",
				change: action.change,
			}),
		};
	}

	if (!primaryAction) {
		return { session: current.session, requiresAbandonConfirmation: false };
	}

	let command: CookingProgressCommand;
	switch (primaryAction.type) {
		case "advance":
			command = { type: "advance" };
			break;
		case "previous-step":
			command = { type: "previous" };
			break;
		case "pause":
			command = { type: "pause", reason: primaryAction.reason };
			break;
		case "resume":
			command = { type: "resume" };
			break;
		case "complete-cooking": {
			const resolved = resolveCookingPosition(current);
			if (!resolved.ok) throw new Error(resolved.message);
			if (!resolved.position.isFinalStep) {
				throw new Error(
					"Flemme tried to finish before the final cooking step.",
				);
			}
			command = { type: "advance" };
			break;
		}
		case "abandon-cooking":
			command = { type: "abandon" };
			break;
	}

	return {
		session: buildCookingSessionProgress(current, command),
		requiresAbandonConfirmation: false,
	};
}

export function cookingSessionMutationLockKey(sessionId: string) {
	return ["cooking", "sessions", sessionId, "mutation-lock"] as const;
}

export function cookingAssistantLockKey(sessionId: string) {
	return ["cooking", "sessions", sessionId, "assistant-lock"] as const;
}

export function beginCookingSessionMutation(
	queryClient: QueryClient,
	lockKey: readonly unknown[],
) {
	if (queryClient.getQueryData(lockKey) === true) return false;
	queryClient.setQueryData(lockKey, true);
	return true;
}

function releaseCookingSessionMutation(
	queryClient: QueryClient,
	lockKey: readonly unknown[],
) {
	queryClient.setQueryData(lockKey, false);
}

export async function requestCookingProgressUpdate(
	queryClient: QueryClient,
	sessionId: string,
	session: ActiveCookingSession,
) {
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}/progress`,
		{
			method: "PATCH",
			body: JSON.stringify({ session }),
		},
		() => handleUnauthorized(queryClient),
	);
	return CookingSessionResponseSchema.parse(payload);
}

async function persistCookingSessionUpdate(
	queryClient: QueryClient,
	sessionId: string,
	session: ActiveCookingSession,
) {
	const lockKey = cookingSessionMutationLockKey(sessionId);
	if (!beginCookingSessionMutation(queryClient, lockKey)) return null;
	try {
		const updated = await requestCookingProgressUpdate(
			queryClient,
			sessionId,
			session,
		);
		queryClient.setQueryData(cookingSessionQueryKey(sessionId), updated);
		return updated;
	} finally {
		releaseCookingSessionMutation(queryClient, lockKey);
	}
}

export async function executeCookingProgressCommand(
	queryClient: QueryClient,
	sessionId: string,
	command: CookingProgressCommand,
) {
	const persisted = queryClient.getQueryData<CookingSessionResponse>(
		cookingSessionQueryKey(sessionId),
	);
	if (!persisted) throw new Error("The cooking session is not loaded.");
	const nextSession = buildCookingSessionProgress(persisted, command);
	return persistCookingSessionUpdate(queryClient, sessionId, nextSession);
}

export async function requestCookingSessionRename(
	queryClient: QueryClient,
	sessionId: string,
	input: UpdateCookingSessionRequest,
) {
	const request = UpdateCookingSessionRequestSchema.parse(input);
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}`,
		{
			method: "PATCH",
			body: JSON.stringify(request),
		},
		() => handleUnauthorized(queryClient),
	);
	return CookingSessionResponseSchema.parse(payload);
}

export async function executeCookingSessionRename(
	queryClient: QueryClient,
	sessionId: string,
	input: UpdateCookingSessionRequest,
) {
	const lockKey = cookingSessionMutationLockKey(sessionId);
	if (!beginCookingSessionMutation(queryClient, lockKey)) return null;
	try {
		const updated = await requestCookingSessionRename(
			queryClient,
			sessionId,
			input,
		);
		queryClient.setQueryData(cookingSessionQueryKey(sessionId), updated);
		return updated;
	} finally {
		releaseCookingSessionMutation(queryClient, lockKey);
	}
}

export async function requestCookingAssistant(
	queryClient: QueryClient,
	sessionId: string,
	message: string,
) {
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}/active-cooking`,
		{
			method: "POST",
			body: JSON.stringify({ message }),
		},
		() => handleUnauthorized(queryClient),
	);
	return ActiveCookingOutputSchema.parse(payload);
}

export async function executeCookingAssistantRequest(
	queryClient: QueryClient,
	sessionId: string,
	message: string,
): Promise<CookingAssistantResult | null> {
	const assistantLock = cookingAssistantLockKey(sessionId);
	if (!beginCookingSessionMutation(queryClient, assistantLock)) return null;
	try {
		const output = await requestCookingAssistant(
			queryClient,
			sessionId,
			message,
		);
		const persisted = queryClient.getQueryData<CookingSessionResponse>(
			cookingSessionQueryKey(sessionId),
		);
		if (!persisted) {
			return {
				output,
				requiresAbandonConfirmation: false,
				actionError: "Flemme replied, but the cooking session is unavailable.",
			};
		}

		let prepared: PreparedAssistantActions;
		try {
			prepared = prepareAssistantActions(persisted, output.actions);
		} catch {
			return {
				output,
				requiresAbandonConfirmation: false,
				actionError:
					"Flemme replied, but its proposed action was not safe to apply.",
			};
		}
		if (prepared.requiresAbandonConfirmation) {
			return { output, requiresAbandonConfirmation: true };
		}
		if (!prepared.session) {
			return { output, requiresAbandonConfirmation: false };
		}

		try {
			const updated = await persistCookingSessionUpdate(
				queryClient,
				sessionId,
				prepared.session,
			);
			if (!updated) {
				return {
					output,
					requiresAbandonConfirmation: false,
					actionError:
						"Flemme replied, but another cooking update is still being saved.",
				};
			}
			return {
				output,
				requiresAbandonConfirmation: false,
				session: updated,
			};
		} catch {
			return {
				output,
				requiresAbandonConfirmation: false,
				actionError:
					"Flemme replied, but its action could not be saved. Try again.",
			};
		}
	} finally {
		releaseCookingSessionMutation(queryClient, assistantLock);
	}
}

export function activeCookingMutationErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Your saved cooking progress is unchanged.";
		}
		if (error.status === 409 || error.status === 422) {
			return "That cooking update is no longer valid. Refresh the session and try again.";
		}
	}
	if (error instanceof Error && error.message) return error.message;
	return "Flemme couldn't save that cooking update. Try again.";
}

export function activeCookingAssistantErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError && error.status === 0) {
		return "Unable to reach Flemme. Your cooking progress is unchanged.";
	}
	return "Flemme couldn't answer right now. Your cooking progress is unchanged.";
}

export function cookingSessionRenameErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError && error.status === 0) {
		return "Unable to reach Flemme. Your dish name is unchanged.";
	}
	return "Flemme couldn't save that dish name. Try again.";
}
export function useCookingProgressMutation(sessionId: string) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationKey: ["cooking", "sessions", sessionId, "progress"],
		mutationFn: (command: CookingProgressCommand) =>
			executeCookingProgressCommand(queryClient, sessionId, command),
	});

	async function submitForResult(command: CookingProgressCommand) {
		try {
			return await mutation.mutateAsync(command);
		} catch {
			return null;
		}
	}

	async function submit(command: CookingProgressCommand) {
		return (await submitForResult(command)) !== null;
	}

	return { ...mutation, submit, submitForResult };
}

export function useCookingAssistantMutation(sessionId: string) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationKey: ["cooking", "sessions", sessionId, "assistant"],
		mutationFn: (message: string) =>
			executeCookingAssistantRequest(queryClient, sessionId, message),
	});

	async function ask(message: string) {
		try {
			return await mutation.mutateAsync(message);
		} catch {
			return null;
		}
	}

	return { ...mutation, ask };
}

export function useRenameCookingSessionMutation(sessionId: string) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationKey: ["cooking", "sessions", sessionId, "rename"],
		mutationFn: (input: UpdateCookingSessionRequest) =>
			executeCookingSessionRename(queryClient, sessionId, input),
	});

	async function submit(customName: string | null) {
		try {
			const updated = await mutation.mutateAsync({ customName });
			return updated !== null;
		} catch {
			return false;
		}
	}

	return { ...mutation, submit };
}
