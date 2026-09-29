import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toGameSession } from '@/lib/mappers';

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { code } = await params;

  const [game] = await getDb()
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.code, code.toUpperCase()))
    .limit(1);
  if (!game) {
    return NextResponse.json({ error: 'Код буруу байна.' }, { status: 404 });
  }

  return NextResponse.json(toGameSession(game));
}
