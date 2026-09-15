import type { ReactNode } from "react";

interface AppShellProps {
	children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div className="min-h-dvh bg-muted">
			<div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:border-x-2 sm:border-foreground">
				{children}
			</div>
		</div>
	);
}
