'use client';

import { Paperclip } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

/** Downloads a class material by id — used wherever an assignment has an
 * attached file (the taker view, and the classwork/marks list rows). Auth
 * here is a bearer token rather than a cookie, so a plain `<a href>` can't
 * be used for this; fetch as a Blob and trigger a synthetic download. */
export function AttachmentLink({
  materialId,
  className,
}: {
  materialId: string;
  className?: string;
}) {
  const toast = useToast();

  async function download(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { blob, fileName } = await api.downloadMaterial(materialId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast('Татахад алдаа гарлаа', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      className={
        className ??
        'inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet hover:underline'
      }
    >
      <Paperclip size={15} /> Хавсралт татах
    </button>
  );
}
