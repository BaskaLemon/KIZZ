import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { levelForXp } from '@/lib/points/level';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }
  return NextResponse.json({
    balance: user.pointsBalance,
    ...levelForXp(user.xp),
  });
}
