-- Preservation-first: user IDs/emails and credential rows/hashes are unchanged.
-- Drizzle's migrator runs this migration transactionally. Refuse incompatible emails.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "users" WHERE email <> btrim(email) OR email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN
  RAISE EXCEPTION 'Auth A1 preflight: incompatible existing email; resolve explicitly before migration';
 END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_credentials" RENAME TO "auth_accounts";--> statement-breakpoint
ALTER TABLE "auth_accounts" RENAME COLUMN "password_hash" TO "password";--> statement-breakpoint
ALTER TABLE "auth_accounts" DROP CONSTRAINT "auth_credentials_user_id_unique";--> statement-breakpoint
ALTER TABLE "auth_sessions" DROP CONSTRAINT "auth_sessions_token_hash_unique";--> statement-breakpoint
ALTER TABLE "auth_accounts" DROP CONSTRAINT "auth_credentials_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "provider_id" text;--> statement-breakpoint
UPDATE "auth_accounts" SET "account_id" = "user_id"::text, "provider_id" = 'credential';--> statement-breakpoint
ALTER TABLE "auth_accounts" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_accounts" ALTER COLUMN "provider_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_accounts" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "access_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "scope" text;--> statement-breakpoint
-- Approved invalidation: old token hashes are NOT Better Auth session tokens.
DELETE FROM "auth_sessions";--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text DEFAULT 'Flemme user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "auth_sessions" DROP COLUMN "token_hash";--> statement-breakpoint
ALTER TABLE "auth_sessions" DROP COLUMN "revoked_at";--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_provider_account_unique" UNIQUE("provider_id","account_id");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_token_unique" UNIQUE("token");
