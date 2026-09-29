import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { shopItems, userInventory, users, type ShopItemRow } from '@/db/schema';
import { recordTransaction } from './ledger';

export interface ShopItemWithOwnership extends ShopItemRow {
  owned: boolean;
}

export async function listShopItems(userId: string): Promise<ShopItemWithOwnership[]> {
  const db = getDb();
  // Sequential, not Promise.all: the shared client holds a single connection
  // (see db/client.ts), and firing two queries at once through Supabase's
  // transaction pooler on that one connection stalls for tens of seconds.
  const items = await db.select().from(shopItems);
  const owned = await db
    .select({ shopItemId: userInventory.shopItemId })
    .from(userInventory)
    .where(eq(userInventory.userId, userId));
  const ownedIds = new Set(owned.map((row) => row.shopItemId));
  return items.map((item) => ({ ...item, owned: ownedIds.has(item.id) }));
}

export async function listInventory(userId: string): Promise<ShopItemRow[]> {
  return getDb()
    .select({
      id: shopItems.id,
      name: shopItems.name,
      description: shopItems.description,
      category: shopItems.category,
      value: shopItems.value,
      price: shopItems.price,
      createdAt: shopItems.createdAt,
    })
    .from(userInventory)
    .innerJoin(shopItems, eq(userInventory.shopItemId, shopItems.id))
    .where(eq(userInventory.userId, userId));
}

export class ItemNotFoundError extends Error {
  constructor() {
    super('Ийм бараа олдсонгүй.');
  }
}
export class AlreadyOwnedError extends Error {
  constructor() {
    super('Та энэ барааг аль хэдийн худалдаж авсан байна.');
  }
}
export class InsufficientBalanceError extends Error {
  constructor() {
    super('Оноо хүрэлцэхгүй байна.');
  }
}

export interface PurchaseResult {
  item: ShopItemRow;
  balance: number;
}

export async function purchaseItem(userId: string, itemId: string): Promise<PurchaseResult> {
  return getDb().transaction(async (tx) => {
    const [item] = await tx.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
    if (!item) throw new ItemNotFoundError();

    const [alreadyOwned] = await tx
      .select({ shopItemId: userInventory.shopItemId })
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.shopItemId, itemId)))
      .limit(1);
    if (alreadyOwned) throw new AlreadyOwnedError();

    // Lock the user's row so two concurrent purchases can't both read the
    // same "before" balance and overspend it.
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user || user.pointsBalance < item.price) {
      throw new InsufficientBalanceError();
    }

    await tx.insert(userInventory).values({ userId, shopItemId: itemId });
    const { balance } = await recordTransaction(tx, {
      userId,
      amount: -item.price,
      type: 'shop_purchase',
      referenceId: itemId,
      description: `Дэлгүүрээс худалдаж авсан: ${item.name}`,
    });

    return { item, balance };
  });
}
