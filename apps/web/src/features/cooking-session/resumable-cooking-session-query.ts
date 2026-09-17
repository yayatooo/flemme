import {
	type CookingSessionResponse,
	type ResumableCookingSessionResponse,
	ResumableCookingSessionResponseSchema,
} from "@flemme/contracts/cooking-session";
import {
	type QueryClient,
	queryOptions,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { cookingSessionQueryKey } from "./cooking-session-query";

export function resumableCookingSessionQueryKey() {
	return ["cooking", "sessions", "resumable"] as const;
}

export async function fetchResumableCookingSession(queryClient: QueryClient) {
	const payload: unknown = await requestApi<unknown>(
		"/cooking-sessions/resumable",
		undefined,
		() => handleUnauthorized(queryClient),
	);
	const response = ResumableCookingSessionResponseSchema.parse(payload);
	if (response.session) {
		queryClient.setQueryData(
			cookingSessionQueryKey(response.session.id),
			response.session,
		);
	}
	return response;
}

export function resumableCookingSessionQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: resumableCookingSessionQueryKey(),
		queryFn: () => fetchResumableCookingSession(queryClient),
		staleTime: 0,
		refetchOnMount: "always",
		retry: false,
	});
}

export function synchronizeResumableCookingSession(
	queryClient: QueryClient,
	session: CookingSessionResponse,
) {
	if (
		session.session.status === "active" ||
		session.session.status === "paused"
	) {
		queryClient.setQueryData(resumableCookingSessionQueryKey(), {
			session,
		} satisfies ResumableCookingSessionResponse);
		return;
	}

	const cached = queryClient.getQueryData<ResumableCookingSessionResponse>(
		resumableCookingSessionQueryKey(),
	);
	if (cached?.session?.id === session.id) {
		queryClient.setQueryData(resumableCookingSessionQueryKey(), {
			session: null,
		} satisfies ResumableCookingSessionResponse);
	}
	void queryClient.invalidateQueries({
		queryKey: resumableCookingSessionQueryKey(),
		exact: true,
	});
}

export function useResumableCookingSession() {
	const queryClient = useQueryClient();
	return useQuery(resumableCookingSessionQueryOptions(queryClient));
}
