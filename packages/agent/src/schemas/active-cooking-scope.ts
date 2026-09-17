import { z } from "zod";

export const ActiveCookingScopeSchema = z.enum([
	"in_scope",
	"out_of_phase",
	"off_topic",
	"ambiguous",
]);

export type ActiveCookingScope = z.infer<typeof ActiveCookingScopeSchema>;

export const ActiveCookingOutOfPhaseTopicSchema = z.enum([
	"nutrition",
	"favorites",
	"history",
	"profile",
	"inventory",
	"recommendation",
	"pre_cooking",
	"completion",
]);

export type ActiveCookingOutOfPhaseTopic = z.infer<
	typeof ActiveCookingOutOfPhaseTopicSchema
>;
