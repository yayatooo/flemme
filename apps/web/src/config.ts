const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl || !URL.canParse(apiUrl) || new URL(apiUrl).origin !== apiUrl) {
	throw new Error("VITE_API_URL must be an exact HTTP(S) origin");
}

export const API_URL = apiUrl;
