'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Gamepad2, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, SkeletonList } from '@/components/ui';
import { QuizGenButton } from '@/components/QuizGenButton';
import { QuizPlayer } from '@/components/QuizPlayer';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ApiError, Note, Quiz } from '@/lib/types';

export function ClassQuiz({
  classId,
  isTeacher,
}: {
  classId: string;
  isTeacher: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listClassQuizzes(classId), api.listClassNotes(classId)])
      .then(([q, n]) => {
        setQuizzes(q);
        setNotes(n);
      })
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Quiz-үүдийг ачаалж чадсангүй', 'error');
        setQuizzes([]);
        setNotes([]);
      });
  }, [classId, toast]);

  function handleGenerated(quiz: Quiz) {
    setQuizzes((prev) => (prev ? [quiz, ...prev] : [quiz]));
  }

  async function hostGame(quizId: string) {
    setStarting(quizId);
    try {
      const game = await api.createGame(quizId);
      router.push(`/play/${game.id}`);
    } catch (err) {
      toast(
        (err as ApiError).payload?.error || 'Тоглоом үүсгэхэд алдаа гарлаа',
        'error',
      );
    } finally {
      setStarting(null);
    }
  }

  async function deleteQuiz(quiz: Quiz) {
    if (!window.confirm(`"${quiz.title}" quiz-ийг устгах уу? Үүнийг буцаах боломжгүй.`)) return;
    try {
      await api.deleteQuiz(quiz.id);
      setQuizzes((prev) => (prev ? prev.filter((q) => q.id !== quiz.id) : prev));
      toast('Quiz устгагдлаа');
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Устгахад алдаа гарлаа', 'error');
    }
  }

  if (activeQuiz) {
    return <QuizPlayer quiz={activeQuiz} onBack={() => setActiveQuiz(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2.5 text-lg">Quiz-үүд</h3>
        {quizzes === null ? (
          <SkeletonList rows={2} />
        ) : quizzes.length === 0 ? (
          <EmptyState title="Quiz алга">
            <p>Доорх тэмдэглэл дээрх товчоор эхний quiz-ээ үүсгээрэй.</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-3.5 rounded-lg border border-line bg-paper-raised p-4 shadow-sm transition-colors hover:border-violet/40"
              >
                <button
                  type="button"
                  onClick={() => setActiveQuiz(quiz)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet">
                    <ClipboardList size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base text-ink">
                      {quiz.title}
                    </h3>
                    <p className="text-[13px] text-ink-soft">
                      {quiz.questions.length} асуулт
                    </p>
                  </div>
                </button>
                <Button
                  onClick={() => hostGame(quiz.id)}
                  disabled={starting === quiz.id}
                  className="shrink-0"
                >
                  <Gamepad2 size={15} />
                  {starting === quiz.id ? 'Үүсгэж байна...' : 'Тоглоом'}
                </Button>
                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => deleteQuiz(quiz)}
                    aria-label={`${quiz.title} устгах`}
                    title="Устгах"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2.5 text-lg">Тэмдэглэлээс quiz үүсгэх</h3>
        {notes === null ? (
          <SkeletonList rows={2} />
        ) : notes.length === 0 ? (
          <EmptyState title="Тэмдэглэл алга">
            <p>Эхлээд &quot;Тэмдэглэл&quot; таб дээр тэмдэглэл үүсгээрэй.</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="flex items-center justify-between gap-4 rounded-lg"
              >
                <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
                  {note.title}
                </p>
                <div className="w-44 shrink-0">
                  <QuizGenButton
                    noteId={note.id}
                    noteTitle={note.title}
                    onGenerated={handleGenerated}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
