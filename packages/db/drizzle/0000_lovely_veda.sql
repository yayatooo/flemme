CREATE TYPE "public"."cooking_session_pause_reason" AS ENUM('user-request', 'missing-ingredient', 'missing-equipment', 'interruption', 'other');--> statement-breakpoint
CREATE TYPE "public"."cooking_session_phase" AS ENUM('recommendation', 'pre_cooking', 'active_cooking', 'completion');--> statement-breakpoint
CREATE TYPE "public"."cooking_session_status" AS ENUM('active', 'paused', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."inventory_condition" AS ENUM('fresh', 'use_soon', 'unknown');--> statement-breakpoint
CREATE TABLE "auth_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_credentials_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
CREATE TABLE "cooking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phase" "cooking_session_phase" DEFAULT 'recommendation' NOT NULL,
	"status" "cooking_session_status" DEFAULT 'active' NOT NULL,
	"pause_reason" "cooking_session_pause_reason",
	"recommendation_snapshot" jsonb,
	"selected_recipe_snapshot" jsonb,
	"pre_cooking_plan_snapshot" jsonb,
	"current_stage_id" text,
	"current_step_id" text,
	"completed_step_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completion_snapshot" jsonb,
	"nutrition_snapshot" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cooking_sessions_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "cooking_sessions_pause_reason_matches_status" CHECK (("cooking_sessions"."status" = 'paused' and "cooking_sessions"."pause_reason" is not null) or ("cooking_sessions"."status" <> 'paused' and "cooking_sessions"."pause_reason" is null)),
	CONSTRAINT "cooking_sessions_selected_recipe_required_after_recommendation" CHECK ("cooking_sessions"."phase" = 'recommendation' or "cooking_sessions"."selected_recipe_snapshot" is not null),
	CONSTRAINT "cooking_sessions_plan_and_position_required_during_execution" CHECK ("cooking_sessions"."phase" not in ('active_cooking', 'completion') or ("cooking_sessions"."pre_cooking_plan_snapshot" is not null and "cooking_sessions"."current_stage_id" is not null and "cooking_sessions"."current_step_id" is not null)),
	CONSTRAINT "cooking_sessions_completion_state" CHECK (("cooking_sessions"."status" = 'completed' and "cooking_sessions"."phase" = 'completion' and "cooking_sessions"."completed_at" is not null) or ("cooking_sessions"."status" <> 'completed' and "cooking_sessions"."completed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cooking_session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_cooking_session_id_unique" UNIQUE("user_id","cooking_session_id")
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"toddlers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "households_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "households_counts_non_negative" CHECK ("households"."adults" >= 0 and "households"."children" >= 0 and "households"."toddlers" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventories_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid NOT NULL,
	"ingredient_key" text NOT NULL,
	"quantity" numeric(14, 3),
	"unit" text,
	"is_approximate" boolean DEFAULT false NOT NULL,
	"condition" "inventory_condition" DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_inventory_id_ingredient_key_unique" UNIQUE("inventory_id","ingredient_key"),
	CONSTRAINT "inventory_items_ingredient_key_kebab_case" CHECK ("inventory_items"."ingredient_key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "inventory_items_quantity_positive" CHECK ("inventory_items"."quantity" is null or "inventory_items"."quantity" > 0),
	CONSTRAINT "inventory_items_quantity_unit_pair" CHECK (("inventory_items"."quantity" is null and "inventory_items"."unit" is null) or ("inventory_items"."quantity" is not null and length(trim("inventory_items"."unit")) > 0))
);
--> statement-breakpoint
CREATE TABLE "kitchens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kitchens_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "kitchen_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kitchen_equipment_kitchen_id_name_unique" UNIQUE("kitchen_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"food_preferences" text[] DEFAULT '{}' NOT NULL,
	"cooking_preferences" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_cooking_session_user_fk" FOREIGN KEY ("cooking_session_id","user_id") REFERENCES "public"."cooking_sessions"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchens" ADD CONSTRAINT "kitchens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_equipment" ADD CONSTRAINT "kitchen_equipment_kitchen_id_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cooking_sessions_user_status_updated_at_idx" ON "cooking_sessions" USING btree ("user_id","status","updated_at");