'use client';

import { useId, useState } from 'react';
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react';

interface AttachedFile {
  id: string;
  name: string;
  sizeLabel: string;
  isPdf: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploaderPlaceholder() {
  const inputId = useId();
  const [files, setFiles] = useState<AttachedFile[]>([]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: AttachedFile[] = Array.from(list).map((f) => ({
      id: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      sizeLabel: formatSize(f.size),
      isPdf: f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    }));
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 p-5 text-center transition-colors hover:border-ink/30"
      >
        <UploadCloud size={22} className="text-ink-soft" />
        <span className="text-sm font-semibold text-ink">
          Файл чирж оруулах, эсвэл дарж сонгох
        </span>
        <span className="text-xs text-ink-soft">PDF, JPG, PNG дэмжинэ</span>
        <input
          id={inputId}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2"
            >
              {f.isPdf ? (
                <FileText size={16} className="shrink-0 text-ink-soft" />
              ) : (
                <ImageIcon size={16} className="shrink-0 text-ink-soft" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {f.name}
                </p>
                <p className="text-xs text-ink-soft">{f.sizeLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`${f.name} хасах`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
