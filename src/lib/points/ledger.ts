import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { pointTransactions, users, type PointTransactionType } from '@/db/schema';

// The callback type `db.transaction()` passes in — derived from getDb()'s own
// return type instead of importing drizzle-orm's internal transaction type,
// so this keeps working across drizzle-orm/postgres-js versions.
export type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

export interface RecordTransactionInput {
  userId: string;
  /** Positive to award points, negative to spend them. */
  amount: number;
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
  // a lifetime progress counter — it only ever goes up, so purchases (negative
  // amounts) don't touch it.
  const xpGain = Math.max(input.amount, 0);

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
    type: input.type,
    referenceId: input.referenceId,
    description: input.description,
  });

  return { balance: updated.pointsBalance, xp: updated.xp };
}
