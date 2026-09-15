import { Link } from "@tanstack/react-router";
import { Heart, History, Home, type LucideIcon, Package } from "lucide-react";

interface NavigationItem {
	to: "/app" | "/app/inventory" | "/app/history" | "/app/favorites";
	label: string;
	icon: LucideIcon;
}

const navigationItems: readonly NavigationItem[] = [
	{ to: "/app", label: "Home", icon: Home },
	{ to: "/app/inventory", label: "Inventory", icon: Package },
	{ to: "/app/history", label: "History", icon: History },
	{ to: "/app/favorites", label: "Favorites", icon: Heart },
];

export function BottomNavigation() {
	return (
		<nav
			aria-label="Primary navigation"
			className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-xl border-t-2 border-foreground bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:border-x-2"
		>
			<div className="grid grid-cols-4 gap-1">
				{navigationItems.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.to}
							to={item.to}
							activeOptions={{ exact: item.to === "/app" }}
							className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-1 text-[0.65rem] leading-none font-bold no-underline outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
							activeProps={{
								className:
									"border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_var(--ink)]",
							}}
							inactiveProps={{
								className:
									"border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
							}}
						>
							<Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
							<span className="truncate">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
