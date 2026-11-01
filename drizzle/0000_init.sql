CREATE SCHEMA IF NOT EXISTS "revu";
--> statement-breakpoint
CREATE TYPE "revu"."destination_type" AS ENUM('google_review', 'custom_url');--> statement-breakpoint
CREATE TYPE "revu"."scan_os" AS ENUM('ios', 'android', 'other');--> statement-breakpoint
CREATE TYPE "revu"."scan_outcome" AS ENUM('redirect', 'inactive');--> statement-breakpoint
CREATE TYPE "revu"."scan_via" AS ENUM('code', 'legacy');--> statement-breakpoint
CREATE TYPE "revu"."tag_event_action" AS ENUM('create', 'assign', 'reassign', 'change_destination', 'relabel', 'disable', 'enable', 'unassign');--> statement-breakpoint
CREATE TYPE "revu"."tag_status" AS ENUM('unassigned', 'active', 'disabled');--> statement-breakpoint
CREATE TABLE "revu"."batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revu"."businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"google_place_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "revu"."review_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "revu"."review_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"business_id" uuid NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revu"."scans" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "revu"."scans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tag_id" uuid NOT NULL,
	"business_id" uuid,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"os" "revu"."scan_os" NOT NULL,
	"country" varchar(2),
	"referer" text,
	"via" "revu"."scan_via" NOT NULL,
	"outcome" "revu"."scan_outcome" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revu"."tag_aliases" (
	"alias" text PRIMARY KEY NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revu"."tag_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "revu"."tag_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tag_id" uuid NOT NULL,
	"actor_email" text NOT NULL,
	"action" "revu"."tag_event_action" NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revu"."tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(6) NOT NULL,
	"batch_id" uuid,
	"business_id" uuid,
	"status" "revu"."tag_status" DEFAULT 'unassigned' NOT NULL,
	"destination_type" "revu"."destination_type" DEFAULT 'google_review' NOT NULL,
	"destination_url" text,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_code_unique" UNIQUE("code"),
	CONSTRAINT "tags_active_needs_business" CHECK ("revu"."tags"."status" <> 'active' OR "revu"."tags"."business_id" IS NOT NULL),
	CONSTRAINT "tags_destination_consistent" CHECK (("revu"."tags"."destination_type" = 'custom_url' AND "revu"."tags"."destination_url" IS NOT NULL)
        OR ("revu"."tags"."destination_type" = 'google_review' AND "revu"."tags"."destination_url" IS NULL)),
	CONSTRAINT "tags_custom_url_https" CHECK ("revu"."tags"."destination_url" IS NULL OR "revu"."tags"."destination_url" LIKE 'https://%')
);
--> statement-breakpoint
ALTER TABLE "revu"."review_snapshots" ADD CONSTRAINT "review_snapshots_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "revu"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."scans" ADD CONSTRAINT "scans_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "revu"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."scans" ADD CONSTRAINT "scans_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "revu"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."tag_aliases" ADD CONSTRAINT "tag_aliases_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "revu"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."tag_events" ADD CONSTRAINT "tag_events_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "revu"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."tags" ADD CONSTRAINT "tags_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "revu"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revu"."tags" ADD CONSTRAINT "tags_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "revu"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_snapshots_business_time_idx" ON "revu"."review_snapshots" USING btree ("business_id","captured_at");--> statement-breakpoint
CREATE INDEX "scans_business_time_idx" ON "revu"."scans" USING btree ("business_id","scanned_at");--> statement-breakpoint
CREATE INDEX "scans_tag_time_idx" ON "revu"."scans" USING btree ("tag_id","scanned_at");--> statement-breakpoint
CREATE INDEX "tag_aliases_tag_idx" ON "revu"."tag_aliases" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tag_events_tag_time_idx" ON "revu"."tag_events" USING btree ("tag_id","created_at");--> statement-breakpoint
CREATE INDEX "tags_business_idx" ON "revu"."tags" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "tags_batch_idx" ON "revu"."tags" USING btree ("batch_id");