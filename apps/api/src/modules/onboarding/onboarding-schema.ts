import { z } from "@hono/zod-openapi";

export const OnboardingStepSchema = z.enum([
	"profile",
	"household",
	"kitchen",
	"inventory",
	"complete",
]);

export const OnboardingStatusResponseSchema = z.object({
	completed: z.boolean(),
	completedAt: z.iso.datetime().nullable(),
	nextStep: OnboardingStepSchema.nullable(),
});

export type OnboardingStatusResponse = z.infer<
	typeof OnboardingStatusResponseSchema
>;
