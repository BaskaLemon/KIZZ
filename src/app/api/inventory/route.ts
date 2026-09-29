import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { listInventory } from '@/lib/points/shop';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }
  const items = await listInventory(user.id);
  return NextResponse.json({ items });
}
