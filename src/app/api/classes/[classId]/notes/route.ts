import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toNote } from '@/lib/mappers';
import { resolveUserNames } from '@/lib/userNames';

type Params = { params: Promise<{ classId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

  const rows = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.classId, classId))
    .orderBy(desc(notes.updatedAt));

  const names = await resolveUserNames(rows.map((row) => row.updatedBy));
  return NextResponse.json(
    rows.map((row) => toNote(row, names.get(row.updatedBy))),
  );
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

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
    .values({ classId, title, content: '', updatedBy: auth.user.id })
    .returning();

  return NextResponse.json(toNote(row, auth.user.name), { status: 201 });
}
