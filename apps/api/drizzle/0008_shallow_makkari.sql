CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_id" uuid,
	"body" varchar(2000) NOT NULL,
	"created_at" timestamp DEFAULT date_trunc('milliseconds', now()) NOT NULL,
	CONSTRAINT "feedback_body_nonempty_chk" CHECK (trim("feedback"."body") <> '')
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_version_id_deliverable_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."deliverable_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_parent_id_feedback_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_versionId_idx" ON "feedback" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "feedback_parentId_idx" ON "feedback" USING btree ("parent_id");