import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isGroupMember } from '@/lib/access';
import { toNote } from '@/lib/mappers';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { groupId } = await params;

  if (!(await isGroupMember(groupId, auth.user.id))) {
    return NextResponse.json(
      { error: 'Та энэ группын гишүүн биш байна.' },
      { status: 403 },
    );
  }

  const rows = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.groupId, groupId))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(rows.map((row) => toNote(row)));
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { groupId } = await params;

  if (!(await isGroupMember(groupId, auth.user.id))) {
    return NextResponse.json(
      { error: 'Та энэ группын гишүүн биш байна.' },
      { status: 403 },
    );
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
    .values({ groupId, title, content: '', updatedBy: auth.user.id })
    .returning();

  return NextResponse.json(toNote(row), { status: 201 });
}
