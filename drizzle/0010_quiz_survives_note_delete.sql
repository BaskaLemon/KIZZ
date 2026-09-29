ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_source_note_id_notes_id_fk";
--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "source_note_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_source_note_id_notes_id_fk" FOREIGN KEY ("source_note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;