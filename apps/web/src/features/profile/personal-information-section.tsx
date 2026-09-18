import { Pencil } from "lucide-react";
import { useRef, useState } from "react";
import type { CurrentUser } from "@/auth/auth-query";
import { getUserDisplayName, getUserInitial } from "@/auth/user-display-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	nameMutationErrorMessage,
	useUpdateDisplayNameMutation,
} from "./profile-mutations";

interface PersonalInformationSectionProps {
	user: CurrentUser;
}

export function PersonalInformationSection({
	user,
}: PersonalInformationSectionProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(user.name);
	const submitLock = useRef(false);
	const updateName = useUpdateDisplayNameMutation();
	const displayName = getUserDisplayName(user);

	function changeOpen(nextOpen: boolean) {
		setOpen(nextOpen);
		if (nextOpen) setName(user.name);
		else updateName.reset();
	}

	async function submitName() {
		const nextName = name.trim();
		if (!nextName || submitLock.current) return;
		submitLock.current = true;
		try {
			await updateName.mutateAsync(nextName);
			setOpen(false);
		} catch {
			// Mutation state renders controlled retry copy and preserves the input.
		} finally {
			submitLock.current = false;
		}
	}

	return (
		<section aria-labelledby="personal-information-title">
			<Card className="bg-secondary shadow-[4px_4px_0_var(--ink)]">
				<CardHeader className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4">
					<Avatar
						className="size-16"
						role="img"
						aria-label={`${displayName}'s avatar`}
					>
						{user.image ? <AvatarImage src={user.image} alt="" /> : null}
						<AvatarFallback className="text-xl">
							{getUserInitial(user)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<CardTitle
							id="personal-information-title"
							className="break-words text-2xl"
						>
							{displayName}
						</CardTitle>
						<CardDescription className="mt-1 break-all">
							{user.email}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<label htmlFor="profile-email" className="text-sm font-extrabold">
							Email
						</label>
						<Input
							id="profile-email"
							value={user.email}
							readOnly
							aria-describedby="profile-email-help"
						/>
						<p
							id="profile-email-help"
							className="text-xs leading-relaxed text-muted-foreground"
						>
							Email changes are not available yet.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => changeOpen(true)}
					>
						<Pencil aria-hidden="true" />
						Edit display name
					</Button>
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={changeOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit display name</DialogTitle>
						<DialogDescription>
							This name appears in your Flemme greeting and account header.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void submitName();
						}}
					>
						<div className="grid gap-2">
							<label htmlFor="profile-name" className="text-sm font-extrabold">
								Display name
							</label>
							<Input
								id="profile-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								autoComplete="name"
								aria-invalid={updateName.isError}
								disabled={updateName.isPending}
							/>
						</div>
						{updateName.isError ? (
							<p className="text-sm font-bold text-destructive" role="alert">
								{nameMutationErrorMessage()}
							</p>
						) : null}
						<Button
							type="submit"
							className="w-full"
							disabled={updateName.isPending || name.trim().length === 0}
						>
							{updateName.isPending ? "Saving…" : "Save name"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
}
