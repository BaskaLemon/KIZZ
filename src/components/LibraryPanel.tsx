'use client';

import { useEffect, useState } from 'react';
import { Copy, Users } from 'lucide-react';
import { Button, Card, EmptyState, SkeletonList, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { cx } from '@/lib/cx';
import { useToast } from '@/lib/toast';
import type { ApiError, LibraryItem, Quiz } from '@/lib/types';

/** Browse quizzes other people shared and copy them into your own. */
export function LibraryPanel({ onCopied }: { onCopied: (quiz: Quiz) => void }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'new' | 'popular'>('popular');
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Debounce typing so we don't query on every keystroke.
    const id = setTimeout(() => {
      api
        .listLibrary(q.trim(), sort)
        .then((res) => {
          if (!cancelled) setItems(res.items);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    }, q ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, sort]);

  async function copy(item: LibraryItem) {
    setBusy(item.id);
    try {
      const quiz = await api.copyLibraryQuiz(item.id);
      onCopied(quiz);
      setItems((prev) =>
        prev?.map((i) => (i.id === item.id ? { ...i, copied: true, copyCount: i.copyCount + 1 } : i)) ?? prev,
      );
      toast('Quiz таны жагсаалтад нэмэгдлээ');
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Хуулж чадсангүй', 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <TextInput
          className="min-w-48 flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Нийтийн сангаас хайх..."
          aria-label="Нийтийн сангаас хайх"
        />
        <div className="flex gap-2" role="group" aria-label="Эрэмбэ">
          {(
            [
              ['popular', 'Алдартай'],
              ['new', 'Шинэ'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={cx(
                'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
                sort === value
                  ? 'border-transparent bg-ink text-paper'
                  : 'border-line bg-paper-raised text-ink hover:border-ink/30',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <SkeletonList rows={3} />
      ) : items.length === 0 ? (
        <EmptyState title={q ? 'Олдсонгүй' : 'Сан хоосон байна'}>
          <p>
            {q
              ? 'Өөр үгээр хайгаад үзээрэй.'
              : 'Анхны quiz-ээ нийтэлж үзээрэй: "Миний Quiz-үүд" дээрх 🌐 товчийг дар.'}
          </p>
        </EmptyState>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base">{item.title}</h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-soft">
                  <span>{item.authorName}</span>
                  <span>{item.questionCount} асуулт</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} aria-hidden /> {item.copyCount} хуулсан
                  </span>
                </p>
                {item.sample.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5 text-[13px] text-ink-soft">
                    {item.sample.map((s, i) => (
                      <li key={i} className="truncate">
                        · {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => copy(item)}
                disabled={busy === item.id || item.mine || item.copied}
                className="shrink-0"
              >
                <Copy size={15} />{' '}
                {item.mine ? 'Таны quiz' : item.copied ? 'Хуулсан ✓' : 'Хуулж авах'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
