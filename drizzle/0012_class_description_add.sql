ALTER TABLE "classes" ADD COLUMN "description" text;--> statement-breakpoint
-- Carry the old section/level/subject/room over into the new description,
-- joined the way the overview used to show them ("subject · section · level · room").
UPDATE "classes" SET "description" = concat_ws(' · ', "subject", "section", "level", "room")
WHERE coalesce("subject", "section", "level", "room") IS NOT NULL;
