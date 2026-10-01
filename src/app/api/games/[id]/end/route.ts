import { NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

// Host-only: abandons a game that hasn't finished (host left the page).
// Nothing is paid out — placement points are only awarded by a game that
// plays through to the end (see /next).
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const ended = await getDb()
    .update(gameSessions)
    .set({ status: 'finished' })
    .where(
      and(
        eq(gameSessions.id, id),
        eq(gameSessions.createdBy, auth.user.id),
        ne(gameSessions.status, 'finished'),
      ),
    )
    .returning({ id: gameSessions.id });

  return NextResponse.json({ ended: ended.length > 0 });
}
