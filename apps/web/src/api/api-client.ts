import { API_URL } from "../config";

interface FlemmeErrorPayload {
	error: {
		code: string;
		message: string;
	};
}

export class FlemmeApiError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = "FlemmeApiError";
		this.status = status;
		this.code = code;
	}
}

function isFlemmeErrorPayload(value: unknown): value is FlemmeErrorPayload {
	if (!value || typeof value !== "object" || !("error" in value)) return false;
	const error = value.error;
	return (
		!!error &&
		typeof error === "object" &&
		"code" in error &&
		typeof error.code === "string" &&
		"message" in error &&
		typeof error.message === "string"
	);
}

export async function requestApi<T>(
	path: string,
	init?: RequestInit,
	onUnauthorized?: () => void,
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(`${API_URL}${path}`, {
			...init,
			credentials: "include",
			headers: {
				Accept: "application/json",
				...(init?.body ? { "Content-Type": "application/json" } : {}),
				...init?.headers,
			},
		});
	} catch {
		throw new FlemmeApiError(0, "NETWORK_ERROR", "Unable to reach Flemme");
	}

	const payload: unknown = await response.json().catch(() => undefined);
	if (response.ok) return payload as T;

	if (response.status === 401) onUnauthorized?.();
	if (isFlemmeErrorPayload(payload)) {
		throw new FlemmeApiError(
			response.status,
			payload.error.code,
			payload.error.message,
		);
	}
	throw new FlemmeApiError(
		response.status,
		"UNEXPECTED_RESPONSE",
		"Flemme returned an unexpected response",
	);
}
