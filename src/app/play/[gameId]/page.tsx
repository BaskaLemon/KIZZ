'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AnswerGrid,
  AnswerOption,
  Leaderboard,
  PlayerGrid,
  RoomCodeCard,
  StageHeader,
  StageScreen,
  TimerRing,
} from '@/components/Stage';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { avatarSrcFor } from '@/lib/avatar';
import { refreshNotifications } from '@/lib/events';
import { MIN_PLAYERS_FOR_REWARDS } from '@/lib/points/rules';
import { useToast } from '@/lib/toast';
import type { ApiError, GameState, LeaderboardRow } from '@/lib/types';

const POLL_MS = 1500;
// Mirrors ANSWER_WINDOW_MS in src/lib/game.ts (the scoring source of
// truth) — duplicated here rather than imported since that file pulls in
// server-only DB modules that can't ship to the client bundle.
const ANSWER_WINDOW_MS = 20_000;

function avatarOf(p: GameState['players'][number]): string {
  return avatarSrcFor({
    id: p.userId,
    avatarOptions: p.avatarOptions,
    equippedItemId: p.equippedItemId,
  });
}

function toLeaderboard(state: GameState): LeaderboardRow[] {
  return state.players.map((p, i) => ({
    id: p.id,
    rank: i + 1,
    name: p.name,
    score: p.score,
    avatar: avatarOf(p),
  }));
}

export default function PlayGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const s = await api.getGameState(gameId);
        if (!cancelled) setState(s);
      } catch {
        // Transient poll failures are ignored — the next tick retries.
      }
    }
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameId]);

  useEffect(() => {
    const startedAt = state?.questionStartedAt;
    if (!startedAt || state.status !== 'active' || state.revealed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setSecondsLeft(Math.max(0, Math.ceil((ANSWER_WINDOW_MS - elapsed) / 1000)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state?.questionStartedAt, state?.status, state?.revealed]);

  // The host's client reveals the answer automatically once time is up, so
  // the game keeps moving without an extra click every question.
  const isHost = state?.isHost;
  const startedAt = state?.questionStartedAt;
  const activeUnrevealed = state?.status === 'active' && !state.revealed;
  useEffect(() => {
    if (!isHost || !activeUnrevealed || !startedAt) return;
    const remaining =
      new Date(startedAt).getTime() + ANSWER_WINDOW_MS - Date.now();
    const id = setTimeout(
      () => {
        api
          .revealGame(gameId)
          .then(setState)
          .catch(() => {
            // Already revealed manually — the next poll picks that up.
          });
      },
      Math.max(remaining, 0) + 400,
    );
    return () => clearTimeout(id);
  }, [isHost, activeUnrevealed, startedAt, gameId]);

  // A finished game may have levelled the player up — refresh the bell.
  const finished = state?.status === 'finished';
  useEffect(() => {
    if (finished) refreshNotifications();
  }, [finished]);

  // Everyone has answered → no reason to wait out the timer.
  const answeredCount = state?.answeredCount ?? 0;
  const playerCount = state?.players.length ?? 0;
  const questionIndex = state?.currentQuestionIndex ?? 0;
  useEffect(() => {
    if (!isHost || !activeUnrevealed || playerCount === 0) return;
    if (answeredCount < playerCount) return;
    api
      .revealGame(gameId)
      .then(setState)
      .catch(() => {
        // Already revealed — the next poll picks that up.
      });
  }, [isHost, activeUnrevealed, answeredCount, playerCount, questionIndex, gameId]);

  async function act<T>(fn: () => Promise<T>) {
    setBusy(true);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    const s = await act(() => api.startGame(gameId));
    if (s) setState(s);
  }
  async function handleAnswer(optionIndex: number) {
    const s = await act(() => api.answerGame(gameId, optionIndex));
    if (s) setState(s);
  }
  async function handleReveal() {
    const s = await act(() => api.revealGame(gameId));
    if (s) setState(s);
  }
  async function handleNext() {
    const s = await act(() => api.nextGame(gameId));
    if (s) setState(s);
  }

  if (!state) {
    return (
      <StageScreen>
        <LoadingScreen />
      </StageScreen>
    );
  }

  return (
    <StageScreen immersive={state.status === 'active'}>
      <StageHeader>
        {state.status === 'active' && !state.revealed && (
          <TimerRing seconds={secondsLeft} />
        )}
      </StageHeader>

      {state.status === 'lobby' && (
        <div className="flex w-full max-w-155 flex-col items-center gap-6">
          <RoomCodeCard
            label="Тоглоомд нэгдэх код"
            code={state.code}
            hint={`${state.players.length} тоглогч нэгдсэн`}
          />
          <p className="text-center text-sm text-ink-soft">
            {state.players.length >= MIN_PLAYERS_FOR_REWARDS
              ? 'Coin, XP олгогдоно'
              : `Coin, XP олгогдохын тулд дор хаяж ${MIN_PLAYERS_FOR_REWARDS} тоглогч хэрэгтэй`}
          </p>
          <PlayerGrid
            players={state.players.map((p) => ({ id: p.id, name: p.name, avatar: avatarOf(p) }))}
          />
          {state.isHost ? (
            <Button variant="primary" size="lg" onClick={handleStart} disabled={busy}>
              Тоглоом эхлүүлэх
            </Button>
          ) : (
            <p className="text-ink-soft">Тоглоомыг эхлүүлэхийг хүлээж байна...</p>
          )}
        </div>
      )}

      {state.status === 'active' && state.question && !state.revealed && (
        <div className="flex w-full max-w-225 flex-col items-center gap-6">
          <p className="text-center font-display text-2xl">{state.question.prompt}</p>
          <p className="text-ink-soft">
            Асуулт {state.currentQuestionIndex + 1} / {state.totalQuestions}
          </p>
          {state.isHost ? (
            <>
              <AnswerGrid>
                {state.question.options.map((opt, i) => (
                  <AnswerOption key={i} index={i} label={opt} interactive={false} />
                ))}
              </AnswerGrid>
              <Leaderboard rows={toLeaderboard(state)} />
              <Button variant="primary" onClick={handleReveal} disabled={busy}>
                Хариу харуулах
              </Button>
              <p className="text-sm text-ink-soft">
                {state.answeredCount} / {state.players.length} хариулсан ·
                хүн бүр хариулах эсвэл хугацаа дуусахад хариу автоматаар харагдана.
              </p>
            </>
          ) : (
            <AnswerGrid>
              {state.question.options.map((opt, i) => (
                <AnswerOption
                  key={i}
                  index={i}
                  label={opt}
                  chosen={state.myAnswer === i}
                  disabled={state.myAnswer !== null || busy}
                  onClick={() => handleAnswer(i)}
                />
              ))}
            </AnswerGrid>
          )}
          {!state.isHost && state.myAnswer !== null && (
            <p className="text-ink-soft">Хариулт илгээгдлээ, хариу хүлээж байна...</p>
          )}
        </div>
      )}

      {state.status === 'active' && state.question && state.revealed && (
        <div className="flex w-full max-w-225 flex-col items-center gap-6">
          <p className="text-center font-display text-2xl">{state.question.prompt}</p>
          {!state.isHost && (
            <p
              className={
                state.myAnswer === null
                  ? 'font-semibold text-ink-soft'
                  : state.myAnswer === state.question.correctIndex
                    ? 'font-semibold text-mint'
                    : 'font-semibold text-coral'
              }
            >
              {state.myAnswer === null
                ? 'Та хариулсангүй'
                : state.myAnswer === state.question.correctIndex
                  ? 'Зөв хариуллаа! 🎉'
                  : 'Буруу хариулт'}
            </p>
          )}
          <AnswerGrid>
            {state.question.options.map((opt, i) => (
              <AnswerOption
                key={i}
                index={i}
                label={opt}
                interactive={false}
                correct={i === state.question?.correctIndex}
                dimmed={i !== state.question?.correctIndex}
                chosen={state.myAnswer === i}
                count={state.question?.tally?.[i] ?? 0}
              />
            ))}
          </AnswerGrid>
          <Leaderboard rows={toLeaderboard(state)} />
          {state.isHost ? (
            <Button variant="primary" onClick={handleNext} disabled={busy}>
              {state.currentQuestionIndex + 1 >= state.totalQuestions
                ? 'Дуусгах'
                : 'Дараагийн асуулт'}
            </Button>
          ) : (
            <p className="text-ink-soft">Дараагийн асуултыг хүлээж байна...</p>
          )}
        </div>
      )}

      {state.status === 'finished' && (
        <div className="flex w-full max-w-155 flex-col items-center gap-6">
          <p className="font-display text-3xl">Тоглоом дууслаа!</p>
          {state.myReward && <RewardCard state={state} reward={state.myReward} />}
          {state.isHost && state.players.length < MIN_PLAYERS_FOR_REWARDS && (
            <p className="text-center text-sm text-ink-soft">
              {MIN_PLAYERS_FOR_REWARDS}-аас цөөн тоглогчтой тул coin, XP олгогдсонгүй.
            </p>
          )}
          <Leaderboard rows={toLeaderboard(state)} />
          <Button variant="ghost" onClick={() => router.push('/play')}>
            Буцах
          </Button>
        </div>
      )}
    </StageScreen>
  );
}

/** What the player earned from a finished game, and why if it is nothing. */
function RewardCard({
  state,
  reward,
}: {
  state: GameState;
  reward: NonNullable<GameState['myReward']>;
}) {
  const earned = reward.coins > 0 || reward.xp > 0;
  let reason = '';
  if (!earned) {
    reason =
      state.players.length < MIN_PLAYERS_FOR_REWARDS
        ? `Coin, XP авахын тулд дор хаяж ${MIN_PLAYERS_FOR_REWARDS} тоглогч хэрэгтэй.`
        : 'Оноо аваагүй тул энэ удаад шагнал олгогдсонгүй.';
  } else if (reward.coins === 0) {
    reason = 'Өнөөдрийн coin-ы дээд хязгаарт хүрсэн тул зөвхөн XP авлаа.';
  }
  return (
    <div className="w-full rounded-2xl border-2 border-violet bg-violet/10 p-5 text-center">
      {reward.rank && (
        <p className="text-sm font-semibold text-ink-soft">Таны байр: #{reward.rank}</p>
      )}
      <div className="mt-2 flex items-center justify-center gap-6">
        <div>
          <p className="font-display text-4xl text-amber">+{reward.coins}</p>
          <p className="text-xs font-semibold text-ink-soft">Kizz Coin</p>
        </div>
        <div>
          <p className="font-display text-4xl text-mint">+{reward.xp}</p>
          <p className="text-xs font-semibold text-ink-soft">XP</p>
        </div>
      </div>
      {reason && <p className="mt-3 text-sm text-ink-soft">{reason}</p>}
    </div>
  );
}
