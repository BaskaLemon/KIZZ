import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { BADGES } from '@/lib/badges';
import { listEarnedBadges } from '@/lib/points/badges';

/** The full badge catalogue with the caller's earned ones marked. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const earned = new Map((await listEarnedBadges(auth.user.id)).map((b) => [b.key, b.earnedAt]));
  return NextResponse.json({
    badges: BADGES.map((b) => ({
      ...b,
      earned: earned.has(b.key),
      earnedAt: earned.get(b.key)?.toISOString() ?? null,
    })),
  });
}
