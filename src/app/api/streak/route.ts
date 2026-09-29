import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getStreakStatus } from '@/lib/points/streak';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }
  const status = await getStreakStatus(user.id);
  return NextResponse.json(status);
}
