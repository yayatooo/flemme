interface UserIdentity {
	name?: string | null;
	email?: string | null;
}

export function getUserDisplayName(user: UserIdentity | null | undefined) {
	const name = user?.name?.trim();
	if (name) return name;

	const username = user?.email?.split("@", 1)[0]?.trim();
	if (!username) return "User";
	return `${username.charAt(0).toLocaleUpperCase()}${username.slice(1)}`;
}

export function getUserInitial(user: UserIdentity | null | undefined) {
	return getUserDisplayName(user).charAt(0).toLocaleUpperCase() || "U";
}
