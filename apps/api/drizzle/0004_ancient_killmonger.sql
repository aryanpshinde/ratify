CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"invited_by" uuid,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp DEFAULT (now() + interval '7 days') NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_projectId_idx" ON "invitations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "invitations_invitedBy_idx" ON "invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_one_active_per_project_email" ON "invitations" USING btree ("project_id",lower("email")) WHERE accepted_at IS NULL AND revoked_at IS NULL;