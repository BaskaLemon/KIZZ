import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { awardPlacementPoints, type PlacementInput } from '@/lib/points/placement';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseResults(body: unknown): PlacementInput[] | null {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { results?: unknown }).results)) {
    return null;
  }
  const results = (body as { results: unknown[] }).results;
  const parsed: PlacementInput[] = [];
  for (const entry of results) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof (entry as { userId?: unknown }).userId !== 'string' ||
      typeof (entry as { rank?: unknown }).rank !== 'number' ||
      typeof (entry as { score?: unknown }).score !== 'number'
    ) {
      return null;
    }
    const e = entry as { userId: string; rank: number; score: number };
    parsed.push({ userId: e.userId, rank: e.rank, score: e.score });
  }
  return parsed;
}

// The normal way a game ends is /next reaching the last question, which
// pays out via the same awardPlacementPoints call below. This route stays
// as a host-only, one-time fallback rather than being removed.
export async function POST(request: Request, { params }: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  const { id } = await params;

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
      { error: 'Зөвхөн тоглоом эхлүүлсэн багш дуусгах боломжтой.' },
      { status: 403 },
    );
  }
  if (session.status === 'finished') {
    return NextResponse.json(
      { error: 'Тоглоом аль хэдийн дууссан байна.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const results = parseResults(body);
  if (!results) {
    return NextResponse.json(
      { error: 'results: [{ userId, rank, score }] шаардлагатай.' },
      { status: 400 },
    );
  }

  const payouts = await awardPlacementPoints(id, results);
  await getDb()
    .update(gameSessions)
    .set({ status: 'finished' })
    .where(eq(gameSessions.id, id));
  return NextResponse.json({ results: payouts });
}
