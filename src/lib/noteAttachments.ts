import { getDb } from '@/db/client';
import { noteAttachments } from '@/db/schema';
import { MAX_FILE_BYTES } from '@/lib/materials';

export const ALLOWED_NOTE_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

/** Max attachments per note — keeps a single note's stored bytes bounded. */
export const MAX_ATTACHMENTS_PER_NOTE = 10;

// Never select `data` outside the single download route.
export const noteAttachmentColumns = {
  id: noteAttachments.id,
  noteId: noteAttachments.noteId,
  uploadedBy: noteAttachments.uploadedBy,
  fileName: noteAttachments.fileName,
  mimeType: noteAttachments.mimeType,
  sizeBytes: noteAttachments.sizeBytes,
  createdAt: noteAttachments.createdAt,
};

export function validateNoteAttachment(
  file: unknown,
): { error: string; status: number } | null {
  if (!(file instanceof File)) {
    return { error: 'Файл сонгоно уу.', status: 400 };
  }
  if (file.size === 0) {
    return { error: 'Хоосон файл байршуулах боломжгүй.', status: 400 };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      error: `Файлын хэмжээ ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB-с хэтэрч болохгүй.`,
      status: 413,
    };
  }
  if (!ALLOWED_NOTE_ATTACHMENT_TYPES.has(file.type)) {
    return { error: 'Зөвхөн PDF болон зураг дэмжинэ.', status: 415 };
  }
  return null;
}

export async function insertNoteAttachment(params: {
  noteId: string;
  uploadedBy: string;
  file: File;
}) {
  const { noteId, uploadedBy, file } = params;
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await getDb()
    .insert(noteAttachments)
    .values({
      noteId,
      uploadedBy,
      fileName: file.name.slice(0, 255) || 'file',
      mimeType: file.type,
      sizeBytes: file.size,
      data: buffer.toString('base64'),
    })
    .returning(noteAttachmentColumns);
  return row;
}
