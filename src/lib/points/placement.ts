import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameResults, placementRewards, pointTransactions } from '@/db/schema';
import { grantBadge } from './badges';
import { recordTransaction, type Tx } from './ledger';
import {
  DAILY_GAME_COIN_CAP,
  GAME_XP_BY_RANK,
  GAME_XP_PARTICIPATION,
  MIN_PLAYERS_FOR_REWARDS,
  startOfTodayUb,
} from './rules';

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

/** Coins this user already earned from game placements today (Ulaanbaatar). */
async function coinsEarnedToday(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ total: sql<number>`coalesce(sum(${pointTransactions.amount}), 0)::int` })
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.userId, userId),
        eq(pointTransactions.type, 'quiz_placement'),
        gte(pointTransactions.createdAt, startOfTodayUb()),
      ),
    );
  return row?.total ?? 0;
}

/**
 * Records final standings for one finished game and pays out. To keep
 * placements from being farmed:
 *  - fewer than MIN_PLAYERS_FOR_REWARDS players -> nobody earns anything;
 *  - a player who never scored earns nothing;
 *  - coins from placements are capped per player per day (XP is not).
 * `results` need not be pre-sorted; each entry's own `rank` decides its
 * reward. The result row is always recorded, with the coins actually paid.
 * `unrewarded` lists users who played but never earn or count towards the
 * minimum — the host playing along with their own game.
 */
export async function awardPlacementPoints(
  gameSessionId: string,
  results: PlacementInput[],
  unrewarded: string[] = [],
): Promise<PlacementResult[]> {
  if (results.length === 0) return [];

  const rewardTable = await loadRewardTable(results.map((r) => r.rank));
  const fallbackPoints = rewardTable.get(FALLBACK_RANK) ?? 0;
  const skip = new Set(unrewarded);
  const eligibleGame =
    results.filter((r) => !skip.has(r.userId)).length >= MIN_PLAYERS_FOR_REWARDS;

  return getDb().transaction(async (tx) => {
    const payouts: PlacementResult[] = [];

    for (const result of results) {
      let coins = 0;
      let xp = 0;
      if (eligibleGame && result.score > 0 && !skip.has(result.userId)) {
        const reward = rewardTable.get(result.rank) ?? fallbackPoints;
        const room = Math.max(0, DAILY_GAME_COIN_CAP - (await coinsEarnedToday(tx, result.userId)));
        coins = Math.min(reward, room);
        xp = GAME_XP_BY_RANK[result.rank] ?? GAME_XP_PARTICIPATION;
      }

      await tx.insert(gameResults).values({
        gameSessionId,
        userId: result.userId,
        rank: result.rank,
        score: result.score,
        awardedPoints: coins,
      });

      if (coins > 0 || xp > 0) {
        await recordTransaction(tx, {
          userId: result.userId,
          amount: coins,
          xp,
          type: 'quiz_placement',
          referenceId: gameSessionId,
          description: `${result.rank}-р байр`,
        });
      }

      if (result.rank === 1 && xp > 0) await grantBadge(tx, result.userId, 'first_win');

      payouts.push({ ...result, pointsAwarded: coins });
    }

    return payouts;
  });
}
