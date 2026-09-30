import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toNote } from '@/lib/mappers';
import { awardOnce } from '@/lib/points/awards';
import { FIRST_NOTE_XP } from '@/lib/points/rules';

/** Personal notes — visible only to their owner. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const rows = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.ownerId, auth.user.id))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(rows.map((row) => toNote(row, auth.user.name)));
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json(
      { error: 'Тэмдэглэлийн гарчгаа оруулна уу.' },
      { status: 400 },
    );
  }

  const [row] = await getDb()
    .insert(notes)
    .values({
      ownerId: auth.user.id,
      title,
      content: '',
      updatedBy: auth.user.id,
    })
    .returning();

  const xp = await awardOnce(auth.user.id, 'first_note', FIRST_NOTE_XP, 'Анхны тэмдэглэл');
  return NextResponse.json({ ...toNote(row, auth.user.name), reward: xp ? { xp } : undefined }, { status: 201 });
}
