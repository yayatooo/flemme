import { expect, test } from "bun:test";
import { buildRecommendationRequest } from "../recommendation/recommendation-query";
import { quickStartOptions } from "./quick-start-options";

test("every Quick Start option produces the shared session request shape", () => {
	for (const option of quickStartOptions) {
		expect(buildRecommendationRequest(option.request)).toEqual({
			session: { request: option.request },
		});
	}
});
