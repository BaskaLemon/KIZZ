ALTER TABLE "users" ADD COLUMN "equipped_item_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_equipped_item_id_shop_items_id_fk" FOREIGN KEY ("equipped_item_id") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- The 'voxel-art' DiceBear style isn't available in the locally rendered
-- collection (avatars are now generated in-app), so swap that one shop item
-- for 'pixel-art'. Its id is unchanged, so anyone who already owns it keeps it.
UPDATE "shop_items" SET "name" = 'Pixel art аватар', "value" = REPLACE("value", '/voxel-art/', '/pixel-art/') WHERE "value" LIKE '%/voxel-art/%';
