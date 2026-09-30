import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gamePlayers, gameSessions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { loadGameState } from '@/lib/game';
import { pgErrorCode, UNIQUE_VIOLATION } from '@/lib/dbErrors';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

// Idempotent: joining a game you already joined just returns the current
// state rather than erroring, so the client can call this unconditionally.
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const [session] = await getDb()
    .select({ id: gameSessions.id, createdBy: gameSessions.createdBy, status: gameSessions.status })
    .from(gameSessions)
    .where(eq(gameSessions.id, id))
    .limit(1);
  if (!session) {
    return NextResponse.json({ error: 'Тоглоом олдсонгүй.' }, { status: 404 });
  }

  if (session.createdBy === auth.user.id) {
    return NextResponse.json(
      { error: 'Тоглоомыг эхлүүлсэн хүн өөрийн тоглоомд тоглогчоор нэгдэх боломжгүй.' },
      { status: 403 },
    );
  }
  if (session.status === 'finished') {
    return NextResponse.json({ error: 'Энэ тоглоом дууссан байна.' }, { status: 409 });
  }

  try {
    await getDb()
      .insert(gamePlayers)
      .values({ gameSessionId: id, userId: auth.user.id });
  } catch (err) {
    if (pgErrorCode(err) !== UNIQUE_VIOLATION) throw err;
  }

  const state = await loadGameState(id, auth.user.id);
  return NextResponse.json(state);
}
