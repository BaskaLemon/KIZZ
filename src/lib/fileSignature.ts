import { normalizeMime } from '@/lib/materials';

const startsWith = (b: Uint8Array, sig: number[], at = 0) =>
  sig.every((byte, i) => b[at + i] === byte);

/** True if the file's leading bytes match what its declared MIME type claims,
 * so e.g. an .exe renamed to .png is refused. */
export function matchesSignature(mimeType: string, head: Uint8Array): boolean {
  switch (normalizeMime(mimeType)) {
    case 'application/pdf':
      return startsWith(head, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case 'image/png':
      return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/jpeg':
      return startsWith(head, [0xff, 0xd8, 0xff]);
    case 'image/gif':
      return startsWith(head, [0x47, 0x49, 0x46, 0x38]); // GIF8
    case 'image/webp':
      return startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8);
    case 'application/zip':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return startsWith(head, [0x50, 0x4b, 0x03, 0x04]); // PK..
    case 'application/msword':
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.ms-excel':
      return startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'text/plain':
      return !head.includes(0); // no NUL bytes in text
    default:
      return false;
  }
}

export async function fileHasValidSignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return matchesSignature(file.type, head);
}
