CREATE TYPE "public"."deliverable_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "deliverable_versions" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"deliverable_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"external_url" varchar(2048),
	"file_key" varchar(512),
	"file_name" varchar(512),
	"file_size" integer,
	"mime_type" varchar(255),
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deliverable_versions_one_snapshot_chk" CHECK (("deliverable_versions"."external_url" IS NULL) <> ("deliverable_versions"."file_key" IS NULL)),
	CONSTRAINT "deliverable_versions_file_snapshot_complete_chk" CHECK (("deliverable_versions"."file_key" IS NULL) = ("deliverable_versions"."file_name" IS NULL) AND ("deliverable_versions"."file_key" IS NULL) = ("deliverable_versions"."file_size" IS NULL) AND ("deliverable_versions"."file_key" IS NULL) = ("deliverable_versions"."mime_type" IS NULL)),
	CONSTRAINT "deliverable_versions_file_size_chk" CHECK ("deliverable_versions"."file_size" IS NULL OR "deliverable_versions"."file_size" <= 10485760),
	CONSTRAINT "deliverable_versions_external_url_chk" CHECK ("deliverable_versions"."external_url" IS NULL OR "deliverable_versions"."external_url" <> ''),
	CONSTRAINT "deliverable_versions_file_key_chk" CHECK ("deliverable_versions"."file_key" IS NULL OR "deliverable_versions"."file_key" <> ''),
	CONSTRAINT "deliverable_versions_file_name_chk" CHECK ("deliverable_versions"."file_name" IS NULL OR ("deliverable_versions"."file_name" <> '' AND trim("deliverable_versions"."file_name") <> ''))
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "deliverable_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deliverable_versions" ADD CONSTRAINT "deliverable_versions_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable_versions" ADD CONSTRAINT "deliverable_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deliverable_versions_deliverableId_versionNumber_uidx" ON "deliverable_versions" USING btree ("deliverable_id","version_number");--> statement-breakpoint
CREATE INDEX "deliverable_versions_deliverableId_idx" ON "deliverable_versions" USING btree ("deliverable_id");--> statement-breakpoint
CREATE INDEX "deliverables_projectId_idx" ON "deliverables" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deliverables_status_idx" ON "deliverables" USING btree ("status");