import { NextResponse } from 'next/server';
import { asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { noteAttachments, notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';
import { toNoteAttachment } from '@/lib/mappers';
import {
  MAX_ATTACHMENTS_PER_NOTE,
  insertNoteAttachment,
  noteAttachmentColumns,
  validateNoteAttachment,
} from '@/lib/noteAttachments';

type Params = { params: Promise<{ noteId: string }> };

async function loadNote(noteId: string, userId: string) {
  const [note] = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);
  if (!note || !(await canAccessNote(note, userId))) return null;
  return note;
}

const notFound = () =>
  NextResponse.json({ error: 'Тэмдэглэл олдсонгүй.' }, { status: 404 });

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;
  if (!(await loadNote(noteId, auth.user.id))) return notFound();

  const rows = await getDb()
    .select(noteAttachmentColumns)
    .from(noteAttachments)
    .where(eq(noteAttachments.noteId, noteId))
    .orderBy(asc(noteAttachments.createdAt));
  return NextResponse.json(rows.map(toNoteAttachment));
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;
  if (!(await loadNote(noteId, auth.user.id))) return notFound();

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  const invalid = validateNoteAttachment(file);
  if (invalid) {
    return NextResponse.json({ error: invalid.error }, { status: invalid.status });
  }

  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(noteAttachments)
    .where(eq(noteAttachments.noteId, noteId));
  if (total >= MAX_ATTACHMENTS_PER_NOTE) {
    return NextResponse.json(
      { error: `Нэг тэмдэглэлд ${MAX_ATTACHMENTS_PER_NOTE}-с олон файл хавсаргах боломжгүй.` },
      { status: 400 },
    );
  }

  const row = await insertNoteAttachment({
    noteId,
    uploadedBy: auth.user.id,
    file: file as File,
  });
  return NextResponse.json(toNoteAttachment(row), { status: 201 });
}
