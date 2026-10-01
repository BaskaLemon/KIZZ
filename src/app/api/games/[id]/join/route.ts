import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
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

  // The host can play along, but only from the lobby (they see the answers
  // as the game runs) and without earning coins or XP — see placement.ts.
  if (session.createdBy === auth.user.id && session.status !== 'lobby') {
    return NextResponse.json(
      { error: 'Хост зөвхөн тоглоом эхлэхээс өмнө тоглогчоор нэгдэж болно.' },
      { status: 409 },
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

/** Leave the lobby (e.g. the host deciding not to play after all). */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const [session] = await getDb()
    .select({ status: gameSessions.status })
    .from(gameSessions)
    .where(eq(gameSessions.id, id))
    .limit(1);
  if (!session) {
    return NextResponse.json({ error: 'Тоглоом олдсонгүй.' }, { status: 404 });
  }
  if (session.status !== 'lobby') {
    return NextResponse.json(
      { error: 'Тоглоом эхэлсэн тул гарах боломжгүй.' },
      { status: 409 },
    );
  }

  await getDb()
    .delete(gamePlayers)
    .where(and(eq(gamePlayers.gameSessionId, id), eq(gamePlayers.userId, auth.user.id)));
  return NextResponse.json(await loadGameState(id, auth.user.id));
}
