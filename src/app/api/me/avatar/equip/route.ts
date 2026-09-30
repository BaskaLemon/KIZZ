import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { shopItems, userInventory, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isUuid } from '@/lib/uuid';

/** Wear a bought avatar (`{ itemId }`) or go back to the customized one
 * (`{ itemId: null }`). */
export async function PUT(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const itemId = body?.itemId;
  const db = getDb();

  if (itemId === null) {
    await db.update(users).set({ equippedItemId: null }).where(eq(users.id, auth.user.id));
    return NextResponse.json({ equippedItemId: null });
  }
  if (typeof itemId !== 'string' || !isUuid(itemId)) {
    return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
  }

  const [owned] = await db
    .select({ id: shopItems.id })
    .from(userInventory)
    .innerJoin(shopItems, eq(userInventory.shopItemId, shopItems.id))
    .where(
      and(
        eq(userInventory.userId, auth.user.id),
        eq(userInventory.shopItemId, itemId),
        eq(shopItems.category, 'avatarPreset'),
      ),
    )
    .limit(1);
  if (!owned) {
    return NextResponse.json(
      { error: 'Энэ аватарыг та эзэмшдэггүй.' },
      { status: 403 },
    );
  }

  await db.update(users).set({ equippedItemId: itemId }).where(eq(users.id, auth.user.id));
  return NextResponse.json({ equippedItemId: itemId });
}
