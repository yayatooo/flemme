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
		<header className="sticky top-0 z-20 flex min-h-16 w-full items-center justify-between gap-3 border-b border-border bg-background/95 py-2 backdrop-blur">
			<Link
				to="/app"
				className="font-heading text-2xl leading-none tracking-tight no-underline focus-visible:rounded-sm"
			>
				Flemme<span className="text-primary">.</span>
			</Link>

			<Link
				to="/app/profile"
				aria-label={`Open ${displayName}'s profile`}
				className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<Avatar size="sm" role="img" aria-label={`${displayName}'s avatar`}>
					{user?.image ? <AvatarImage src={user.image} alt="" /> : null}
					<AvatarFallback>{getUserInitial(user)}</AvatarFallback>
				</Avatar>
			</Link>
		</header>
	);
}
