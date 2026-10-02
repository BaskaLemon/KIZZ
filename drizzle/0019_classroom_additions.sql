ALTER TABLE "assignments" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "class_materials" ADD COLUMN "is_submission" boolean DEFAULT false NOT NULL;