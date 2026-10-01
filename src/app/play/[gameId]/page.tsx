'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AnswerGrid,
  AnswerOption,
  Confetti,
  Leaderboard,
  PlayerGrid,
  Podium,
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

/** Players who count towards the reward minimum: everyone but the host. */
function realPlayers(state: GameState): number {
  return state.players.filter((p) => p.userId !== state.hostUserId).length;
}

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
  // Shown instantly on tap, before the server confirms the answer.
  const [pending, setPending] = useState<{ q: number; option: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  // Server clock minus client clock. Deadlines come from the server, so the
  // timer and the host's auto-reveal must not trust this device's own clock.
  const clockOffsetRef = useRef(0);
  const requestSeqRef = useRef(0);
  const appliedSeqRef = useRef(0);

  /** Starts a request; its result may only be applied if nothing newer has
   * been applied since (a slow poll must never overwrite a fresher state). */
  const nextSeq = () => ++requestSeqRef.current;
  const commit = (s: GameState, seq: number) => {
    if (seq <= appliedSeqRef.current) return;
    appliedSeqRef.current = seq;
    clockOffsetRef.current = new Date(s.serverNow).getTime() - Date.now();
    setState(s);
  };
  const serverNow = () => Date.now() + clockOffsetRef.current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Sequential loop: the next poll is scheduled only after the previous one
    // finished, so a slow server can't pile up overlapping requests.
    async function poll() {
      const seq = nextSeq();
      try {
        const s = await api.getGameState(gameId);
        if (!cancelled) commit(s, seq);
      } catch {
        // Transient poll failures are ignored — the next tick retries.
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
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
      const elapsed = serverNow() - new Date(startedAt).getTime();
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
      new Date(startedAt).getTime() + ANSWER_WINDOW_MS - serverNow();
    const id = setTimeout(
      () => {
        const seq = nextSeq();
        api
          .revealGame(gameId)
          .then((s) => commit(s, seq))
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
    const seq = nextSeq();
    api
      .revealGame(gameId)
      .then((s) => commit(s, seq))
      .catch(() => {
        // Already revealed — the next poll picks that up.
      });
  }, [isHost, activeUnrevealed, answeredCount, playerCount, questionIndex, gameId]);

  async function act(fn: () => Promise<GameState>) {
    setBusy(true);
    const seq = nextSeq();
    try {
      const result = await fn();
      commit(result, seq);
      return result;
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handlePlayAlong(play: boolean) {
    await act(() => (play ? api.joinGame(gameId) : api.leaveGame(gameId)));
  }
  async function handleStart() {
    await act(() => api.startGame(gameId));
  }
  async function handleAnswer(optionIndex: number) {
    setPending({ q: state?.currentQuestionIndex ?? 0, option: optionIndex });
    const result = await act(() => api.answerGame(gameId, optionIndex));
    if (!result) setPending(null);
  }
  async function handleReveal() {
    await act(() => api.revealGame(gameId));
  }
  async function handleNext() {
    await act(() => api.nextGame(gameId));
  }

  if (!state) {
    return (
      <StageScreen>
        <LoadingScreen />
      </StageScreen>
    );
  }

  const myChoice =
    state.myAnswer ??
    (pending && pending.q === state.currentQuestionIndex ? pending.option : null);

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
            {realPlayers(state) >= MIN_PLAYERS_FOR_REWARDS
              ? 'Coin, XP олгогдоно'
              : `Coin, XP олгогдохын тулд дор хаяж ${MIN_PLAYERS_FOR_REWARDS} тоглогч хэрэгтэй`}
          </p>
          <PlayerGrid
            players={state.players.map((p) => ({ id: p.id, name: p.name, avatar: avatarOf(p) }))}
          />
          {state.isHost ? (
            <div className="flex flex-col items-center gap-3">
              <Button variant="primary" size="lg" onClick={handleStart} disabled={busy}>
                Тоглоом эхлүүлэх
              </Button>
              <Button
                variant={state.isPlayer ? 'ghost' : 'mint'}
                onClick={() => handlePlayAlong(!state.isPlayer)}
                disabled={busy}
              >
                {state.isPlayer ? 'Би тоглохгүй' : '🎮 Би бас тоглоно'}
              </Button>
              <p className="max-w-sm text-center text-xs text-ink-soft">
                {state.isPlayer
                  ? 'Та тоглогчоор оролцож байна. Хост тоглохдоо coin, XP авахгүй.'
                  : 'Өөрийн тоглоомдоо тоглогчоор оролцож болно (coin, XP авахгүй).'}
              </p>
            </div>
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
                {state.question.options.map((opt, i) =>
                  state.isPlayer ? (
                    <AnswerOption
                      key={i}
                      index={i}
                      label={opt}
                      chosen={myChoice === i}
                      disabled={myChoice !== null || busy}
                      onClick={() => handleAnswer(i)}
                    />
                  ) : (
                    <AnswerOption key={i} index={i} label={opt} interactive={false} />
                  ),
                )}
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
                  chosen={myChoice === i}
                  disabled={myChoice !== null || busy}
                  onClick={() => handleAnswer(i)}
                />
              ))}
            </AnswerGrid>
          )}
          {state.isPlayer && myChoice !== null && (
            <p className="text-ink-soft">Хариулт илгээгдлээ, хариу хүлээж байна...</p>
          )}
        </div>
      )}

      {state.status === 'active' && state.question && state.revealed && (
        <div className="flex w-full max-w-225 flex-col items-center gap-6">
          <p className="text-center font-display text-2xl">{state.question.prompt}</p>
          {state.isPlayer && (
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
          {state.myReward?.rank && state.myReward.rank <= 3 && <Confetti />}
          <p className="font-display text-3xl">Тоглоом дууслаа!</p>
          <Podium rows={toLeaderboard(state)} />
          {state.myReward && <RewardCard state={state} reward={state.myReward} />}
          {state.isHost && !state.isPlayer && realPlayers(state) < MIN_PLAYERS_FOR_REWARDS && (
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
    reason = state.isHost
      ? 'Хост тоглогчоор оролцсон тул coin, XP олгогдсонгүй.'
      : realPlayers(state) < MIN_PLAYERS_FOR_REWARDS
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
