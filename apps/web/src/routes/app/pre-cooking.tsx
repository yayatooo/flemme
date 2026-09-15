import { createFileRoute, redirect } from "@tanstack/react-router";
import { PreCookingPage } from "@/features/pre-cooking";
import { resolvePreCookingEntry } from "@/features/pre-cooking/pre-cooking-query";

export const Route = createFileRoute("/app/pre-cooking")({
	beforeLoad: ({ context }) => {
		const target = resolvePreCookingEntry(context.queryClient);
		if (target) throw redirect({ to: target });
	},
	component: PreCookingPage,
});
