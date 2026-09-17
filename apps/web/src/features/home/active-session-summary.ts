import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { resolveCookingPosition } from "@/features/active-cooking/active-cooking-query";
import { getCookingSessionDisplayName } from "@/features/cooking-session/cooking-session-query";

export interface ActiveSessionSummary {
	id: string;
	displayName: string;
	status: "active" | "paused";
	stageLabel: string;
	stepLabel: string;
}

export function createActiveSessionSummary(
	session: CookingSessionResponse,
): ActiveSessionSummary | null {
	if (
		session.session.status !== "active" &&
		session.session.status !== "paused"
	) {
		return null;
	}
	const resolved = resolveCookingPosition(session);
	if (!resolved.ok) return null;

	return {
		id: session.id,
		displayName: getCookingSessionDisplayName(session),
		status: session.session.status,
		stageLabel: `Stage ${resolved.position.stageIndex + 1} · ${resolved.position.stage.title}`,
		stepLabel: `Current step · ${resolved.position.step.instruction}`,
	};
}
