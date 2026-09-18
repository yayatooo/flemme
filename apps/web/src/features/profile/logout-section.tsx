import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "./profile-mutations";

export function LogoutSection() {
	const navigate = useNavigate();
	const submitLock = useRef(false);
	const logout = useLogoutMutation();

	async function signOutCurrentSession() {
		if (submitLock.current) return;
		submitLock.current = true;
		try {
			await logout.mutateAsync();
			await navigate({ to: "/login", search: { error: undefined } });
		} catch {
			// Keep the authenticated page available with controlled retry copy.
		} finally {
			submitLock.current = false;
		}
	}

	return (
		<section
			aria-labelledby="account-title"
			className="space-y-4 border-t-2 border-foreground pt-6"
		>
			<div className="space-y-1">
				<h2 id="account-title" className="font-heading text-2xl leading-tight">
					Account
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Log out of Flemme on this device. Your saved cooking data stays here
					for next time.
				</p>
			</div>
			{logout.isError ? (
				<p className="text-sm font-bold text-destructive" role="alert">
					Unable to log out. Please try again.
				</p>
			) : null}
			<Button
				type="button"
				variant="outline"
				className="w-full"
				disabled={logout.isPending}
				onClick={() => void signOutCurrentSession()}
			>
				<LogOut aria-hidden="true" />
				{logout.isPending ? "Logging out…" : "Log out"}
			</Button>
		</section>
	);
}
