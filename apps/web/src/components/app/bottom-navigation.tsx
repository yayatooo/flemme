import { Link } from "@tanstack/react-router";
import { Heart, History, Home, type LucideIcon, Package } from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { PlatformContainer } from "./platform-container";

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
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 w-full">
			<PlatformContainer className="pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				<nav aria-label="Primary navigation" className="pointer-events-auto">
					<Dock
						className="mt-0 h-auto max-w-full gap-1 border-border bg-card/95 p-1.5 shadow-card"
						iconSize={60}
						iconMagnification={68}
						iconDistance={96}
						direction="bottom"
					>
						{navigationItems.map((item) => {
							const Icon = item.icon;
							return (
								<DockIcon key={item.to} className="p-0!">
									<Link
										to={item.to}
										activeOptions={{ exact: item.to === "/app" }}
										className="flex size-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-0.5 text-[0.625rem] leading-none font-bold no-underline outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
										activeProps={{
											className:
												"border-border bg-primary text-primary-foreground shadow-control",
										}}
										inactiveProps={{
											className:
												"border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
										}}
									>
										<Icon
											className="size-5 shrink-0"
											strokeWidth={2.5}
											aria-hidden="true"
										/>
										<span className="max-w-full truncate">{item.label}</span>
									</Link>
								</DockIcon>
							);
						})}
					</Dock>
				</nav>
			</PlatformContainer>
		</div>
	);
}
