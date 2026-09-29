import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';
import { toNote } from '@/lib/mappers';
import { resolveUserNames } from '@/lib/userNames';

type Params = { params: Promise<{ noteId: string }> };

// Generous but bounded — keeps a single note request well under typical
// serverless body/row-size limits without meaningfully constraining actual
// note-taking.
const MAX_CONTENT_LENGTH = 50_000;

async function loadAccessibleNote(noteId: string, userId: string) {
  const [note] = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);
  if (!note) return { note: null, allowed: false };
  const allowed = await canAccessNote(note, userId);
  return { note, allowed };
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;

  const { note, allowed } = await loadAccessibleNote(noteId, auth.user.id);
  if (!note || !allowed) {
    return NextResponse.json(
      { error: 'Тэмдэглэл олдсонгүй.' },
      { status: 404 },
    );
  }

  const names = await resolveUserNames([note.updatedBy]);
  return NextResponse.json(toNote(note, names.get(note.updatedBy)));
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;

  const { note, allowed } = await loadAccessibleNote(noteId, auth.user.id);
  if (!note || !allowed) {
    return NextResponse.json(
      { error: 'Тэмдэглэл олдсонгүй.' },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
  }

  const patch: Partial<typeof notes.$inferInsert> = { updatedBy: auth.user.id };

  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json(
        { error: 'Тэмдэглэлийн гарчгаа оруулна уу.' },
        { status: 400 },
      );
    }
    patch.title = title;
  }

  if ('content' in body) {
    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Тэмдэглэлийн агуулга буруу байна.' },
        { status: 400 },
      );
    }
    if (body.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Тэмдэглэл хэт урт байна (${MAX_CONTENT_LENGTH} тэмдэгтээс ихгүй байх ёстой).` },
        { status: 400 },
      );
    }
    patch.content = body.content;
  }

  const [row] = await getDb()
    .update(notes)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();

  return NextResponse.json(toNote(row, auth.user.name));
}
