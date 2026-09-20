const configuredApiUrl = import.meta.env.VITE_API_URL;
const apiUrl = configuredApiUrl || "/api";
const parsedApiUrl = URL.canParse(apiUrl)
	? new URL(apiUrl)
	: URL.canParse(apiUrl, "https://same-origin.invalid")
		? new URL(apiUrl, "https://same-origin.invalid")
		: undefined;

if (
	!parsedApiUrl ||
	!["http:", "https:"].includes(parsedApiUrl.protocol) ||
	!["/", "/api"].includes(parsedApiUrl.pathname) ||
	parsedApiUrl.search ||
	parsedApiUrl.hash
) {
	throw new Error(
		"VITE_API_URL must be /api, an HTTP(S) origin, or an absolute URL ending in /api",
	);
}

export const API_URL =
	URL.canParse(apiUrl) && parsedApiUrl.pathname === "/"
		? `${parsedApiUrl.origin}/api`
		: apiUrl;
export const API_ORIGIN = URL.canParse(apiUrl)
	? new URL(apiUrl).origin
	: undefined;

const googleAuthFlag = import.meta.env.VITE_GOOGLE_AUTH_ENABLED ?? "false";
if (!["true", "false"].includes(googleAuthFlag)) {
	throw new Error("VITE_GOOGLE_AUTH_ENABLED must be true or false");
}
export const GOOGLE_AUTH_ENABLED = googleAuthFlag === "true";
