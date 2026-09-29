'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Shell, View } from '@/components/Shell';
import { Button, Card, EmptyState, LinkButton, TextInput } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ApiError, Quiz } from '@/lib/types';

export default function PlayPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [code, setCode] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .listMyQuizzes()
      .then(setQuizzes)
      .catch(() => setQuizzes([]));
  }, [user]);

  async function hostGame(quizId: string) {
    setStarting(quizId);
    try {
      const game = await api.createGame(quizId);
      router.push(`/play/${game.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Тоглоом үүсгэхэд алдаа гарлаа', 'error');
    } finally {
      setStarting(null);
    }
  }

  async function deleteQuiz(quiz: Quiz) {
    if (!window.confirm(`"${quiz.title}" quiz-ийг устгах уу? Үүнийг буцаах боломжгүй.`)) return;
    try {
      await api.deleteQuiz(quiz.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      toast('Quiz устгагдлаа');
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Устгахад алдаа гарлаа', 'error');
    }
  }

  async function joinGame() {
    if (!code.trim()) return toast('Тоглоомын кодоо оруулна уу', 'error');
    setJoining(true);
    try {
      const game = await api.lookupGameByCode(code.trim());
      await api.joinGame(game.id);
      router.push(`/play/${game.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Код буруу байна', 'error');
    } finally {
      setJoining(false);
    }
  }

  if (!ready)
    return (
      <Shell activePath="/play">
        <LoadingScreen />
      </Shell>
    );

  return (
    <Shell activePath="/play">
      <View narrow>
        <h2 className="mb-0.5 text-2xl">Шууд тоглоом</h2>
        <p className="mb-5 text-ink-soft">
          Тэмдэглэлээсээ үүсгэсэн quiz-ээ Kahoot маягаар тоглоорой.
        </p>

        {!user ? (
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>Тоглоом тоглохын тулд бүртгэл хийх шаардлагатай.</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-5">
            <Card className="rounded-lg">
              <h3 className="mb-3 text-[17px]">Кодоор нэгдэх</h3>
              <div className="flex flex-wrap gap-3">
                <TextInput
                  className="flex-1"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinGame()}
                  placeholder="ж: 7K3QF"
                />
                <Button variant="mint" onClick={joinGame} disabled={joining}>
                  {joining ? 'Нэгдэж байна...' : 'Нэгдэх'}
                </Button>
              </div>
            </Card>

            <div>
              <h3 className="mb-2.5 text-lg">Миний Quiz-үүд</h3>
              {quizzes.length === 0 ? (
                <EmptyState title="Quiz алга">
                  <p>Тэмдэглэлээсээ quiz үүсгэсний дараа энд харагдана.</p>
                  <LinkButton href="/notes" variant="primary" className="mt-4">
                    Тэмдэглэл рүү очих →
                  </LinkButton>
                </EmptyState>
              ) : (
                <div className="flex flex-col gap-3">
                  {quizzes.map((q) => (
                    <Card key={q.id} className="flex items-center justify-between rounded-lg">
                      <div className="min-w-0">
                        <h3 className="truncate text-base">{q.title}</h3>
                        <p className="text-[13px] text-ink-soft">
                          {q.questions.length} асуулт
                        </p>
                      </div>
                      {q.ownerId === user.id && (
                        <button
                          type="button"
                          onClick={() => deleteQuiz(q)}
                          aria-label={`${q.title} устгах`}
                          title="Устгах"
                          className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-coral/10 hover:text-coral"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => hostGame(q.id)}
                        disabled={starting === q.id}
                      >
                        <Play size={15} />{' '}
                        {starting === q.id ? 'Эхлүүлж байна...' : 'Тоглоом эхлүүлэх'}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </View>
    </Shell>
  );
}
