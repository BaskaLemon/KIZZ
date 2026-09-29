import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { pointTransactions } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth/session';

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

  const history = await getDb()
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, user.id))
    .orderBy(desc(pointTransactions.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return NextResponse.json({ history, page, pageSize: PAGE_SIZE });
}
