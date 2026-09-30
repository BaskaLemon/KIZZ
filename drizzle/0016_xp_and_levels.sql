ALTER TABLE "point_transactions" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_items" ADD COLUMN "min_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
-- XP used to equal every positive amount; keep the existing history consistent.
UPDATE "point_transactions" SET "xp" = "amount" WHERE "amount" > 0;--> statement-breakpoint
-- Unlock the avatars in three tiers: level 1, 3 and 5.
UPDATE "shop_items" SET "min_level" = CASE
  WHEN "name" IN ('Tiny botts аватар', 'Dylan аватар', 'Lorelei аватар', 'Pixel art аватар') THEN 3
  WHEN "name" IN ('Toon Heads аватар', 'Notionists аватар', 'Micah аватар', 'Croodles аватар') THEN 5
  ELSE 1
END
WHERE "category" = 'avatarPreset';
