import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { SessionLoading } from "../auth/auth-shell";
import { NotFoundPage } from "../components/not-found-page";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: Outlet,
	pendingComponent: SessionLoading,
	notFoundComponent: NotFoundPage,
});
