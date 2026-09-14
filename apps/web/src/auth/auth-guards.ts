import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authQueryOptions } from "./auth-query";

export async function requireAuthenticatedUser(queryClient: QueryClient) {
	const user = await queryClient.ensureQueryData(authQueryOptions);
	if (!user) throw redirect({ to: "/login", search: { error: undefined } });
	return user;
}

export async function redirectAuthenticatedUser(queryClient: QueryClient) {
	const user = await queryClient.ensureQueryData(authQueryOptions);
	if (user) throw redirect({ to: "/app" });
}
