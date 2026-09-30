ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_group_id_class_groups_id_fk";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "group_id";--> statement-breakpoint
DROP TABLE "class_groups";
