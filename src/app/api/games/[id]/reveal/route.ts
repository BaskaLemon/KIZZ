import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { loadGameState } from '@/lib/game';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
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
  if (session.createdBy !== auth.user.id) {
    return NextResponse.json(
      { error: 'Зөвхөн тоглоомыг эхлүүлсэн хүн хариу харуулах боломжтой.' },
      { status: 403 },
    );
  }
  if (session.status !== 'active') {
    return NextResponse.json({ error: 'Тоглоом идэвхгүй байна.' }, { status: 400 });
  }

  await getDb()
    .update(gameSessions)
    .set({ revealed: true })
    .where(eq(gameSessions.id, id));

  const state = await loadGameState(id, auth.user.id);
  return NextResponse.json(state);
}
