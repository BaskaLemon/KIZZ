import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notifications, userBadges } from '@/db/schema';
import { BADGE_BY_KEY } from '@/lib/badges';
import type { Tx } from './ledger';

type Db = ReturnType<typeof getDb> | Tx;

/** Grants a badge once and tells the user. Idempotent; works inside a
 * transaction (pass `tx`) or standalone. Never throws into its caller's
 * flow — a badge failing must not fail the action that earned it. */
export async function grantBadge(db: Db, userId: string, key: string): Promise<boolean> {
  const def = BADGE_BY_KEY.get(key);
  if (!def) return false;
  try {
    const inserted = await db
      .insert(userBadges)
      .values({ userId, badgeKey: key })
      .onConflictDoNothing()
      .returning({ key: userBadges.badgeKey });
    if (inserted.length === 0) return false;
    await db.insert(notifications).values({
      userId,
      title: `🏅 Шинэ тэмдэг: ${def.name}`,
      body: def.hint,
      href: '/profile',
      dedupeKey: `badge:${key}`,
    }).onConflictDoNothing();
    return true;
  } catch (err) {
    console.error('grantBadge failed', key, err);
    return false;
  }
}

export async function listEarnedBadges(userId: string) {
  return getDb()
    .select({ key: userBadges.badgeKey, earnedAt: userBadges.earnedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
}
