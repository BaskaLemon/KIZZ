import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { noteAttachments, notes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';

type Params = { params: Promise<{ attachmentId: string }> };

function contentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_') || 'file';
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

const notFound = () =>
  NextResponse.json({ error: 'Файл олдсонгүй.' }, { status: 404 });

async function loadAccessible(attachmentId: string, userId: string) {
  const [attachment] = await getDb()
    .select()
    .from(noteAttachments)
    .where(eq(noteAttachments.id, attachmentId))
    .limit(1);
  if (!attachment) return null;
  const [note] = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.id, attachment.noteId))
    .limit(1);
  if (!note || !(await canAccessNote(note, userId))) return null;
  return attachment;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { attachmentId } = await params;

  const attachment = await loadAccessible(attachmentId, auth.user.id);
  if (!attachment) return notFound();

  const buffer = Buffer.from(attachment.data, 'base64');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': contentDisposition(attachment.fileName),
      'Content-Length': String(buffer.byteLength),
    },
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { attachmentId } = await params;

  const attachment = await loadAccessible(attachmentId, auth.user.id);
  if (!attachment) return notFound();

  await getDb()
    .delete(noteAttachments)
    .where(eq(noteAttachments.id, attachmentId));
  return NextResponse.json({ ok: true });
}
