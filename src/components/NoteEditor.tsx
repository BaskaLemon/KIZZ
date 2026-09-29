'use client';

import { Loader2 } from 'lucide-react';
import { Collaborator, UserAvatarList } from './UserAvatarList';

export type SaveStatus = 'saved' | 'saving' | 'error';

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: 'Хадгалагдсан',
  saving: 'Хадгалж байна...',
  error: 'Хадгалж чадсангүй',
};

export function NoteEditor({
  title,
  content,
  collaborators,
  status,
  lastEditedLabel,
  onTitleChange,
  onContentChange,
}: {
  title: string;
  content: string;
  collaborators: Collaborator[];
  status: SaveStatus;
  lastEditedLabel?: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-paper-raised p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Тэмдэглэлийн гарчиг"
          className="min-w-0 border-none bg-transparent text-xl font-extrabold text-ink outline-none placeholder:text-ink/30 sm:flex-1 sm:text-2xl"
        />
        <UserAvatarList collaborators={collaborators} max={4} />
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Энд хамтдаа тэмдэглэл бичиж эхэл..."
        className="min-h-[420px] w-full resize-y rounded-2xl border border-line bg-paper-raised p-5 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-violet focus:ring-2 focus:ring-violet/15"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          {status === 'saving' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'saved' ? 'bg-green-500' : 'bg-coral'
              }`}
            />
          )}
          {STATUS_LABEL[status]}
          {lastEditedLabel && ` · ${lastEditedLabel}`}
        </span>
        <span>{wordCount} үг</span>
      </div>
    </div>
  );
}
