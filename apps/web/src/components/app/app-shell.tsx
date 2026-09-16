import type { ReactNode } from "react";

interface AppShellProps {
	children: ReactNode;
	hasBottomNavigation?: boolean;
}

export function AppShell({
	children,
	hasBottomNavigation = true,
}: AppShellProps) {
	return (
		<div className="min-h-dvh bg-muted">
			<div
				className={`relative mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background sm:border-x-2 sm:border-foreground ${
					hasBottomNavigation
						? "pb-[calc(5rem+env(safe-area-inset-bottom))]"
						: ""
				}`}
			>
				{children}
			</div>
		</div>
	);
}
