import { Link } from "@tanstack/react-router";
import type { CurrentUser } from "@/auth/auth-query";
import { getUserDisplayName, getUserInitial } from "@/auth/user-display-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppHeaderProps {
	user: CurrentUser | null;
}

export function AppHeader({ user }: AppHeaderProps) {
	const displayName = getUserDisplayName(user);

	return (
		<header className="sticky top-0 z-20 grid min-h-16 w-full grid-cols-[1fr_auto] items-stretch gap-3 py-2.5">
			<Link
				to="/app"
				className="flex min-w-0 items-center rounded-2xl border border-border bg-card px-4 font-heading text-2xl leading-none tracking-tight no-underline shadow-control outline-none transition-colors hover:bg-card/80 focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				Flemme<span className="text-primary">.</span>
			</Link>

			<Link
				to="/app/profile"
				aria-label={`Open ${displayName}'s profile`}
				className="grid size-14 place-items-center rounded-2xl border border-transparent bg-mustard shadow-control outline-none transition-colors hover:bg-mustard/85 focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<Avatar size="sm" role="img" aria-label={`${displayName}'s avatar`}>
					{user?.image ? <AvatarImage src={user.image} alt="" /> : null}
					<AvatarFallback>{getUserInitial(user)}</AvatarFallback>
				</Avatar>
			</Link>
		</header>
	);
}
