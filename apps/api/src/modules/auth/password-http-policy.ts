import type { BetterAuthPlugin } from "better-auth";

// Request normalization must precede the framework's z.email() validation.
export const passwordHttpPolicy = {
	id: "flemme-password-http-policy",
	async onRequest(request) {
		const path = new URL(request.url).pathname.replace(/\/$/, "");
		if (
			request.method !== "POST" ||
			!["/api/auth/sign-up/email", "/api/auth/sign-in/email"].includes(path)
		)
			return;
		const type = request.headers.get("content-type")?.split(";")[0];
		if (type !== "application/json") return;
		let body: unknown;
		try {
			body = await request.clone().json();
		} catch {
			return;
		}
		if (
			!body ||
			typeof body !== "object" ||
			!("email" in body) ||
			typeof body.email !== "string"
		)
			return;
		body.email = body.email.trim().toLowerCase();
		const headers = new Headers(request.headers);
		headers.delete("content-length");
		return {
			request: new Request(request, { headers, body: JSON.stringify(body) }),
		};
	},
	async onResponse(response) {
		if (
			!response.ok ||
			!response.headers.get("content-type")?.includes("application/json")
		)
			return;
		const body: unknown = await response.clone().json();
		if (!body || typeof body !== "object") return;
		let changed = false;
		if ("token" in body) {
			delete body.token;
			changed = true;
		}
		if (
			"session" in body &&
			body.session &&
			typeof body.session === "object" &&
			"token" in body.session
		) {
			delete body.session.token;
			changed = true;
		}
		if (!changed) return;
		const headers = new Headers(response.headers);
		headers.delete("content-length");
		return {
			response: new Response(JSON.stringify(body), {
				status: response.status,
				headers,
			}),
		};
	},
} satisfies BetterAuthPlugin;
