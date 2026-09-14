import { queryOptions, useQuery } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";

export interface CurrentUser {
	id: string;
	email: string;
}

interface CurrentUserResponse {
	user: CurrentUser;
}

export const authQueryKey = ["auth", "current-user"] as const;

export const authQueryOptions = queryOptions({
	queryKey: authQueryKey,
	queryFn: async () => {
		try {
			return (await requestApi<CurrentUserResponse>("/auth/me")).user;
		} catch (error) {
			if (error instanceof FlemmeApiError && error.status === 401) return null;
			throw error;
		}
	},
	retry: false,
	staleTime: 30_000,
});

export function useAuth() {
	const query = useQuery(authQueryOptions);
	return {
		user: query.data ?? null,
		loading: query.isPending,
		authenticated: query.data !== null && query.data !== undefined,
		unauthenticated: query.data === null,
		error: query.error,
	};
}
