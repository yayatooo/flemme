import { z } from "@hono/zod-openapi";

const PreferenceSchema = z.string().trim().min(1);

export const ProfileResponseSchema = z.object({
	foodPreferences: z.array(PreferenceSchema),
	cookingPreferences: z.array(PreferenceSchema),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const PutProfileRequestSchema = ProfileResponseSchema.strict();

export type PutProfileRequest = z.infer<typeof PutProfileRequestSchema>;
