import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import {
	CreateInventoryItemSchema,
	InventoryItemParamsSchema,
	InventoryItemResponseSchema,
	InventoryResponseSchema,
	ReplaceInventoryItemsSchema,
	UpdateInventoryItemSchema,
} from "./inventory-schema";
import { createInventoryService } from "./inventory-service";

function response(schema: z.ZodType, description: string) {
	return { description, content: { "application/json": { schema } } };
}
const errors = {
	400: response(ApiErrorResponseSchema, "Invalid request"),
	401: response(ApiErrorResponseSchema, "Unauthenticated"),
	403: response(ApiErrorResponseSchema, "Another user's item"),
	404: response(ApiErrorResponseSchema, "Resource missing"),
	409: response(ApiErrorResponseSchema, "Duplicate ingredient"),
	422: response(ApiErrorResponseSchema, "Unsupported ingredient"),
	500: response(
		ApiErrorResponseSchema,
		"Invalid persisted state or internal error",
	),
};
const common = { tags: ["Inventory"], security: [{ CurrentUser: [] }] };
export function createInventoryRoute(db: FlemmeDatabase) {
	const route = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, c) => {
			if (!result.success)
				return c.json(
					{
						error: {
							code: "INVALID_REQUEST",
							message: "Request validation failed",
						},
					},
					400,
				);
		},
	});
	const service = createInventoryService(db);
	route.openapi(
		createRoute({
			...common,
			method: "get",
			path: "/",
			summary: "Read current inventory",
			responses: {
				200: response(InventoryResponseSchema, "Inventory"),
				...errors,
			},
		}),
		async (c) => c.json(await service.get(c.get("currentUserId")), 200),
	);
	route.openapi(
		createRoute({
			...common,
			method: "put",
			path: "/",
			summary: "Create or ensure inventory parent",
			responses: {
				200: response(InventoryResponseSchema, "Current inventory"),
				...errors,
			},
		}),
		async (c) => c.json(await service.ensure(c.get("currentUserId")), 200),
	);
	route.openapi(
		createRoute({
			...common,
			method: "put",
			path: "/items",
			summary: "Replace inventory from ingredient names",
			description:
				"Resolves known names to canonical ingredients, preserves unknown names, removes normalized duplicates, and atomically replaces the current inventory.",
			request: {
				body: {
					required: true,
					content: {
						"application/json": { schema: ReplaceInventoryItemsSchema },
					},
				},
			},
			responses: {
				200: response(InventoryResponseSchema, "Replaced inventory"),
				...errors,
			},
		}),
		async (c) =>
			c.json(
				await service.replace(c.get("currentUserId"), c.req.valid("json")),
				200,
			),
	);

	route.openapi(
		createRoute({
			...common,
			method: "post",
			path: "/items",
			summary: "Add a canonical ingredient",
			request: {
				body: {
					required: true,
					content: {
						"application/json": { schema: CreateInventoryItemSchema },
					},
				},
			},
			responses: {
				201: response(InventoryItemResponseSchema, "Created item"),
				...errors,
			},
		}),
		async (c) =>
			c.json(
				await service.create(c.get("currentUserId"), c.req.valid("json")),
				201,
			),
	);
	route.openapi(
		createRoute({
			...common,
			method: "put",
			path: "/items/{id}",
			summary: "Replace item quantity, unit, approximation and condition",
			request: {
				params: InventoryItemParamsSchema,
				body: {
					required: true,
					content: {
						"application/json": { schema: UpdateInventoryItemSchema },
					},
				},
			},
			responses: {
				200: response(InventoryItemResponseSchema, "Updated item"),
				...errors,
			},
		}),
		async (c) =>
			c.json(
				await service.update(
					c.get("currentUserId"),
					c.req.valid("param").id,
					c.req.valid("json"),
				),
				200,
			),
	);
	route.openapi(
		createRoute({
			...common,
			method: "delete",
			path: "/items/{id}",
			summary: "Remove current inventory item",
			request: { params: InventoryItemParamsSchema },
			responses: { 204: { description: "Item removed" }, ...errors },
		}),
		async (c) => {
			await service.delete(c.get("currentUserId"), c.req.valid("param").id);
			return c.body(null, 204);
		},
	);
	return route;
}
