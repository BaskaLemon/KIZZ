import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { pointTransactions, type PointTransactionType } from '@/db/schema';
import { recordTransaction } from './ledger';
import { assignmentCoins, assignmentXp } from './rules';

/** Grants XP once per user for a "first steps" milestone and returns the XP
 * granted (null if already granted). Best-effort: an award failing must never
 * fail the action that triggered it. */
export async function awardOnce(
  userId: string,
  type: Extract<PointTransactionType, 'first_note' | 'first_quiz'>,
  xp: number,
  description: string,
): Promise<number | null> {
  try {
    return await getDb().transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: pointTransactions.id })
        .from(pointTransactions)
        .where(and(eq(pointTransactions.userId, userId), eq(pointTransactions.type, type)))
        .limit(1);
      if (existing) return null;
      await recordTransaction(tx, { userId, amount: 0, xp, type, description });
      return xp;
    });
  } catch (err) {
    console.error('awardOnce failed', err);
    return null;
  }
}

/** XP and a few coins for completing a quiz assignment, scaled by the score.
 * Only the first completion of each assignment pays (resubmitting doesn't).
 * Returns what was granted, or null. */
export async function awardAssignmentCompletion(
  userId: string,
  assignmentId: string,
  score: number,
): Promise<{ coins: number; xp: number } | null> {
  const coins = assignmentCoins(score);
  const xp = assignmentXp(score);
  if (coins <= 0 && xp <= 0) return null;
  try {
    return await getDb().transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: pointTransactions.id })
        .from(pointTransactions)
        .where(
          and(
            eq(pointTransactions.userId, userId),
            eq(pointTransactions.type, 'assignment_completed'),
            eq(pointTransactions.referenceId, assignmentId),
          ),
        )
        .limit(1);
      if (existing) return null;
      await recordTransaction(tx, {
        userId,
        amount: coins,
        xp,
        type: 'assignment_completed',
        referenceId: assignmentId,
        description: `Даалгавар дуусгасан (${score}%)`,
      });
      return { coins, xp };
    });
  } catch (err) {
    console.error('awardAssignmentCompletion failed', err);
    return null;
  }
}
