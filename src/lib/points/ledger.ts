import { and, eq, gt, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  notifications,
  pointTransactions,
  shopItems,
  users,
  type PointTransactionType,
} from '@/db/schema';
import { grantBadge } from './badges';
import { levelForXp } from './level';

// The callback type `db.transaction()` passes in — derived from getDb()'s own
// return type instead of importing drizzle-orm's internal transaction type,
// so this keeps working across drizzle-orm/postgres-js versions.
export type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

export interface RecordTransactionInput {
  userId: string;
  /** Coins: positive to award, negative to spend. */
  amount: number;
  /** XP to grant (lifetime progress). Independent of coins; default 0. */
  xp?: number;
  type: PointTransactionType;
  referenceId?: string;
  description?: string;
}

/**
 * Inserts one ledger row and adjusts the user's cached balance in the same
 * statement set. Always call this inside a `getDb().transaction(...)` block
 * when a flow does more than one write (e.g. a purchase also inserts an
 * inventory row) so the whole thing commits or rolls back together.
 */
export async function recordTransaction(
  tx: Tx,
  input: RecordTransactionInput,
): Promise<{ balance: number; xp: number }> {
  // Coins (pointsBalance) move with every transaction, spent or earned. XP is
  // a separate lifetime progress counter — it only ever goes up, and only by
  // what the caller says the event is worth.
  const xpGain = Math.max(input.xp ?? 0, 0);

  const [updated] = await tx
    .update(users)
    .set({
      pointsBalance: sql`${users.pointsBalance} + ${input.amount}`,
      xp: sql`${users.xp} + ${xpGain}`,
    })
    .where(eq(users.id, input.userId))
    .returning({ pointsBalance: users.pointsBalance, xp: users.xp });

  if (!updated) {
    throw new Error(`recordTransaction: user ${input.userId} not found`);
  }

  await tx.insert(pointTransactions).values({
    userId: input.userId,
    amount: input.amount,
    xp: xpGain,
    type: input.type,
    referenceId: input.referenceId,
    description: input.description,
  });

  // Crossing a level boundary: tell the player, and what it unlocked.
  if (xpGain > 0) {
    const before = levelForXp(updated.xp - xpGain).level;
    const after = levelForXp(updated.xp).level;
    if (after > before) {
      const unlocked = await tx
        .select({ name: shopItems.name })
        .from(shopItems)
        .where(and(gt(shopItems.minLevel, before), lte(shopItems.minLevel, after)));
      await tx
        .insert(notifications)
        .values({
          userId: input.userId,
          title: `🎉 ${after}-р түвшин боллоо!`,
          body: unlocked.length
            ? `Шинэ аватар нээгдлээ: ${unlocked.map((u) => u.name.replace(/ аватар$/, '')).join(', ')}`
            : 'Цааш үргэлжлүүлээрэй!',
          href: unlocked.length ? '/shop' : '/profile',
          dedupeKey: `level:${after}`,
        })
        .onConflictDoNothing();
      if (after >= 5) await grantBadge(tx, input.userId, 'level_5');
      if (after >= 10) await grantBadge(tx, input.userId, 'level_10');
    }
  }

  return { balance: updated.pointsBalance, xp: updated.xp };
}
