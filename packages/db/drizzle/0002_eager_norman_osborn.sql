ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_inventory_id_ingredient_key_unique";--> statement-breakpoint
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_ingredient_key_kebab_case";--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "ingredient_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "identity_key" text;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "inventory_items" SET "identity_key" = "ingredient_key", "name" = "ingredient_key";--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "identity_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_id_identity_key_unique" UNIQUE("inventory_id","identity_key");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_identity_key_normalized" CHECK ("inventory_items"."identity_key" = lower(btrim("inventory_items"."identity_key")) and "inventory_items"."identity_key" !~ '\s{2,}' and length("inventory_items"."identity_key") > 0);--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_ingredient_key_kebab_case" CHECK ("inventory_items"."ingredient_key" is null or "inventory_items"."ingredient_key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');