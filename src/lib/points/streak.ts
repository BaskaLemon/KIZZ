import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { dailyStreaks, streakConfig, type StreakConfigRow } from '@/db/schema';
import { recordTransaction, type Tx } from './ledger';

const DEFAULT_CONFIG: StreakConfigRow = {
  id: 1,
  basePoints: 10,
  incrementPoints: 10,
  maxPoints: null,
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whether `dateStr` (YYYY-MM-DD) is the calendar day right before `today`. */
function isDayBefore(dateStr: string, today: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10) === today;
}

async function getStreakConfig(tx: Tx | ReturnType<typeof getDb>) {
  const [row] = await tx.select().from(streakConfig).where(eq(streakConfig.id, 1)).limit(1);
  return row ?? DEFAULT_CONFIG;
}

/** Points awarded for reaching day `day` (1-indexed) of a streak. */
export function rewardForStreakDay(day: number, config: StreakConfigRow): number {
  const raw = config.basePoints + (day - 1) * config.incrementPoints;
  return config.maxPoints != null ? Math.min(raw, config.maxPoints) : raw;
}

/** The streak day a claim right now would land on, without claiming it. */
function upcomingStreakDay(
  streak: { currentStreak: number; lastClaimedDate: string | null } | undefined,
  today: string,
): number {
  if (!streak || !streak.lastClaimedDate) return 1;
  if (streak.lastClaimedDate === today) return streak.currentStreak; // already claimed
  if (isDayBefore(streak.lastClaimedDate, today)) return streak.currentStreak + 1;
  return 1; // missed a day — streak resets
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastClaimedDate: string | null;
  canClaimToday: boolean;
  nextRewardPoints: number;
}

export async function getStreakStatus(userId: string): Promise<StreakStatus> {
  const db = getDb();
  const [streak] = await db
    .select()
    .from(dailyStreaks)
    .where(eq(dailyStreaks.userId, userId))
    .limit(1);
  const config = await getStreakConfig(db);
  const today = todayUtc();

  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastClaimedDate: streak?.lastClaimedDate ?? null,
    canClaimToday: streak?.lastClaimedDate !== today,
    nextRewardPoints: rewardForStreakDay(upcomingStreakDay(streak, today), config),
  };
}

export class AlreadyClaimedError extends Error {
  constructor() {
    super('Өнөөдрийн урамшууллаа аль хэдийн авсан байна.');
  }
}

export interface ClaimResult {
  streakDay: number;
  pointsAwarded: number;
  balance: number;
}

export async function claimDailyStreak(userId: string): Promise<ClaimResult> {
  const db = getDb();
  const today = todayUtc();

  return db.transaction(async (tx) => {
    const [streak] = await tx
      .select()
      .from(dailyStreaks)
      .where(eq(dailyStreaks.userId, userId))
      .for('update');

    if (streak?.lastClaimedDate === today) {
      throw new AlreadyClaimedError();
    }

    const nextDay = streak && streak.lastClaimedDate && isDayBefore(streak.lastClaimedDate, today)
      ? streak.currentStreak + 1
      : 1;
    const longestStreak = Math.max(streak?.longestStreak ?? 0, nextDay);
    const config = await getStreakConfig(tx);
    const pointsAwarded = rewardForStreakDay(nextDay, config);

    if (streak) {
      await tx
        .update(dailyStreaks)
        .set({
          currentStreak: nextDay,
          longestStreak,
          lastClaimedDate: today,
          updatedAt: new Date(),
        })
        .where(eq(dailyStreaks.userId, userId));
    } else {
      await tx.insert(dailyStreaks).values({
        userId,
        currentStreak: nextDay,
        longestStreak,
        lastClaimedDate: today,
      });
    }

    const { balance } = await recordTransaction(tx, {
      userId,
      amount: pointsAwarded,
      type: 'daily_streak',
      description: `${nextDay}-р өдрийн дараалсан урамшуулал`,
    });

    return { streakDay: nextDay, pointsAwarded, balance };
  });
}
