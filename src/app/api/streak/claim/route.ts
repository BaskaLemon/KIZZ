import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { AlreadyClaimedError, claimDailyStreak } from '@/lib/points/streak';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  try {
    const result = await claimDailyStreak(user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AlreadyClaimedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
