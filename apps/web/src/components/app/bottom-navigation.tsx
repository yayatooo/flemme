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
						className="mt-0 h-auto w-fit gap-2 rounded-3xl border-transparent bg-background/95 p-2 shadow-card"
						iconSize={56}
						iconMagnification={62}
						iconDistance={96}
						direction="bottom"
					>
						{navigationItems.map((item) => {
							const Icon = item.icon;
							return (
								<DockIcon key={item.to} className="rounded-2xl p-0!">
									<Link
										to={item.to}
										activeOptions={{ exact: item.to === "/app" }}
										aria-label={item.label}
										className="flex size-full items-center justify-center rounded-2xl border outline-none transition-[background-color,color,border-radius] focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
										activeProps={{
											className:
												"rounded-xl border-transparent bg-forest text-background shadow-none [&_svg]:text-background",
										}}
										inactiveProps={{
											className:
												"border-transparent text-foreground/55 hover:bg-card hover:text-foreground",
										}}
									>
										<Icon
											className="size-5 shrink-0"
											strokeWidth={2.5}
											aria-hidden="true"
										/>
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
