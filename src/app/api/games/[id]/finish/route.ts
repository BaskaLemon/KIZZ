import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { finishGameSession } from '@/lib/game';
import { isUuid } from '@/lib/uuid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// The normal way a game ends is /next reaching the last question. This route
// is a host-only early finish and uses the same server-side payout.
export async function POST(request: Request, { params }: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  const { id } = await params;

  if (!isUuid(id)) {

    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  }

  const [session] = await getDb()
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, id))
    .limit(1);
  if (!session) {
    return NextResponse.json({ error: 'Тоглоом олдсонгүй.' }, { status: 404 });
  }
  if (session.createdBy !== user.id) {
    return NextResponse.json(
      { error: 'Зөвхөн тоглоомыг эхлүүлсэн хүн дуусгах боломжтой.' },
      { status: 403 },
    );
  }
  if (session.status === 'finished') {
    return NextResponse.json(
      { error: 'Тоглоом аль хэдийн дууссан байна.' },
      { status: 400 },
    );
  }

  if (session.status === 'lobby') {
    return NextResponse.json(
      { error: 'Тоглоом эхлээгүй байна.' },
      { status: 400 },
    );
  }

  // Standings come from the recorded scores, never from the request body.
  const payouts = await finishGameSession(id);
  return NextResponse.json({ results: payouts });
}
