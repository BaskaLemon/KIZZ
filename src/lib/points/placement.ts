import { inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameResults, placementRewards } from '@/db/schema';
import { recordTransaction } from './ledger';

export interface PlacementInput {
  userId: string;
  rank: number;
  score: number;
}

export interface PlacementResult extends PlacementInput {
  pointsAwarded: number;
}

/** rank 0 is the fallback ("participation") reward for any unconfigured rank. */
const FALLBACK_RANK = 0;

async function loadRewardTable(ranks: number[]): Promise<Map<number, number>> {
  const wanted = [...new Set([...ranks, FALLBACK_RANK])];
  const rows = await getDb()
    .select()
    .from(placementRewards)
    .where(inArray(placementRewards.rank, wanted));
  return new Map(rows.map((row) => [row.rank, row.points]));
}

/**
 * Records final standings for one finished game/quiz session and pays out
 * points for every participant in a single transaction. `results` need not
 * be pre-sorted; each entry's own `rank` decides its reward.
 */
export async function awardPlacementPoints(
  gameSessionId: string,
  results: PlacementInput[],
): Promise<PlacementResult[]> {
  if (results.length === 0) return [];

  const rewardTable = await loadRewardTable(results.map((r) => r.rank));
  const fallbackPoints = rewardTable.get(FALLBACK_RANK) ?? 0;

  return getDb().transaction(async (tx) => {
    const payouts: PlacementResult[] = [];

    for (const result of results) {
      const pointsAwarded = rewardTable.get(result.rank) ?? fallbackPoints;

      await tx.insert(gameResults).values({
        gameSessionId,
        userId: result.userId,
        rank: result.rank,
        score: result.score,
        awardedPoints: pointsAwarded,
      });

      await recordTransaction(tx, {
        userId: result.userId,
        amount: pointsAwarded,
        type: 'quiz_placement',
        referenceId: gameSessionId,
        description: `${result.rank}-р байр`,
      });

      payouts.push({ ...result, pointsAwarded });
    }

    return payouts;
  });
}
