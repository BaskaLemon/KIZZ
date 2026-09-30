'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Loader2, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ApiError, Quiz } from '../lib/types';

const COUNT_OPTIONS = [3, 5, 10, 20];

export function QuizGenButton({
  noteId,
  noteTitle,
  onGenerated,
}: {
  noteId: string;
  noteTitle: string;
  onGenerated?: (quiz: Quiz) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [starting, setStarting] = useState(false);

  function close() {
    setOpen(false);
    setStatus('idle');
    setError('');
    setQuiz(null);
  }

  async function generate() {
    setStatus('loading');
    try {
      const generated = await api.generateQuiz(noteId, count);
      setQuiz(generated);
      setStatus('done');
      onGenerated?.(generated);
    } catch (err) {
      setError((err as ApiError).payload?.error || 'Quiz үүсгэхэд алдаа гарлаа');
      setStatus('error');
    }
  }

  async function hostGame() {
    if (!quiz) return;
    setStarting(true);
    try {
      const game = await api.createGame(quiz.id);
      router.push(`/play/${game.id}`);
    } catch (err) {
      setError(
        (err as ApiError).payload?.error || 'Тоглоом үүсгэхэд алдаа гарлаа',
      );
      setStarting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-500 py-3 text-sm font-bold text-white shadow-sm transition-shadow hover:shadow-md"
      >
        <Sparkles size={15} /> Quiz үүсгэх
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper-raised p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
                  AI
                </span>
                <h2 className="mt-2 text-xl font-bold text-ink">
                  Quiz үүсгэх
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            {status !== 'done' && (
              <>
                <p className="mt-4 text-sm text-ink-soft">
                  &quot;{noteTitle || 'Тэмдэглэл'}&quot; тэмдэглэлийн агуулгаас AI
                  олон сонголттой асуулт үүсгэнэ.
                </p>

                {status === 'error' && (
                  <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-sm font-medium text-coral">
                    {error}
                  </p>
                )}

                <div className="mt-5">
                  <p className="text-sm font-semibold text-ink">
                    Асуултын тоо
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COUNT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                          count === n
                            ? 'border-transparent bg-ink text-paper'
                            : 'border-line bg-paper-raised text-ink hover:border-ink/30'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={generate}
                    disabled={status === 'loading'}
                    className="flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-60"
                  >
                    {status === 'loading' && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {status === 'loading' ? 'Үүсгэж байна...' : 'Асуулт үүсгэх'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink/30"
                  >
                    Цуцлах
                  </button>
                </div>
              </>
            )}

            {status === 'done' && quiz && (
              <>
                <p className="mt-4 text-sm font-semibold text-green-600">
                  {quiz.questions.length} асуулт бэлэн боллоо
                </p>
                {quiz.questions.length < count && (
                  <p className="mt-1 text-xs text-ink-soft">
                    Тэмдэглэлийн агуулга хангалттай биш тул {count} биш{' '}
                    {quiz.questions.length} асуулт үүслээ. Тэмдэглэлээ урт болговол илүү олон асуулт гарна.
                  </p>
                )}
                {error && (
                  <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-sm font-medium text-coral">
                    {error}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-3">
                  {quiz.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-line p-4"
                    >
                      <p className="text-sm font-bold text-ink">
                        {i + 1}. {q.prompt}
                      </p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {q.options.map((opt, oi) => (
                          <span
                            key={oi}
                            className={`rounded-lg px-3 py-1.5 text-sm ${
                              oi === q.correctIndex
                                ? 'bg-green-500/10 font-semibold text-green-700'
                                : 'text-ink-soft'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={hostGame}
                    disabled={starting}
                    className="flex items-center gap-1.5 rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:opacity-60"
                  >
                    {starting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Gamepad2 size={15} />
                    )}
                    {starting ? 'Үүсгэж байна...' : 'Тоглоом болгох'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90"
                  >
                    Хаах
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
