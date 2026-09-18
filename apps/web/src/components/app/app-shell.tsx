import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
	children: ReactNode;
	hasBottomNavigation?: boolean;
}

export function AppShell({
	children,
	hasBottomNavigation = true,
}: AppShellProps) {
	return (
		<div
			data-theme="platform"
			className={cn(
				"flex min-h-dvh flex-col bg-background text-foreground",
				hasBottomNavigation && "pb-[calc(6.5rem+env(safe-area-inset-bottom))]",
			)}
		>
			{children}
		</div>
	);
}
