import type { ReactNode } from 'react';
import { Shell } from './Shell';
import { cx } from '@/lib/cx';
import type { LeaderboardRow } from '@/lib/types';

export const LETTERS = ['A', 'B', 'C', 'D'] as const;
const ANSWER_BG = ['bg-answer-1', 'bg-answer-2', 'bg-answer-3', 'bg-answer-4'];

/** Game screens live inside the regular app shell (header, nav, theme). */
export function StageScreen({
  children,
  immersive = false,
}: {
  children: ReactNode;
  immersive?: boolean;
}) {
  return (
    <Shell activePath="/play" immersive={immersive}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center p-4 sm:p-8">
        {children}
      </div>
    </Shell>
  );
}

/** Right-aligned strip above the game content (e.g. the timer). */
export function StageHeader({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-5 flex w-full max-w-225 items-center justify-end">
      {children}
    </div>
  );
}

export function RoomCodeCard({
  label,
  code,
  hint,
}: {
  label: string;
  code: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border-3 border-violet bg-paper-raised px-8 py-8 text-center shadow-pop-md">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="my-2 font-display text-[64px] tracking-[10px] text-ink max-md:text-[40px] max-md:tracking-[6px]">
        {code}
      </p>
      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function TimerRing({ seconds }: { seconds: number }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border-5 border-amber font-display text-xl text-ink">
      {seconds}
    </span>
  );
}

interface AnswerOptionProps {
  index: number;
  label: string;
  interactive?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  chosen?: boolean;
  /** Reveal state: this is the right answer. */
  correct?: boolean;
  /** Reveal state: how many players picked this option. */
  count?: number;
  onClick?: () => void;
}

export function AnswerOption({
  index,
  label,
  interactive = true,
  disabled,
  dimmed,
  chosen,
  correct,
  count,
  onClick,
}: AnswerOptionProps) {
  return (
    <button
      type="button"
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? onClick : undefined}
      disabled={interactive ? disabled : false}
      className={cx(
        'flex items-center gap-3 rounded-md border-none p-5 text-left font-display text-[19px] shadow-[4px_4px_0_rgba(0,0,0,0.35)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-default',
        ANSWER_BG[index],
        'text-white',
        !interactive && 'cursor-default',
        dimmed && 'opacity-35',
        chosen && 'outline outline-4 outline-ink',
        correct && 'outline outline-4 outline-mint',
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-display text-lg font-bold text-black"
      >
        {LETTERS[index]}
      </span>
      <span className="flex-1">
        {label}
        {correct ? ' ✓' : ''}
      </span>
      {count !== undefined && (
        <span className="ml-auto min-w-9 shrink-0 rounded-full bg-black/25 px-3 py-1 text-center text-base font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

export function AnswerGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full max-w-225 grid-cols-2 gap-3 max-md:grid-cols-1">
      {children}
    </div>
  );
}

function Avatar({ src, name, className }: { src?: string; name: string; className: string }) {
  if (!src) return null;
  return <img src={src} alt={name} className={cx('shrink-0 rounded-full object-cover', className)} />;
}

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="flex w-full max-w-155 flex-col gap-2">
      {rows.map((p) => (
        <div
          key={p.id}
          className={cx(
            'flex items-center gap-2.5 rounded-sm border-2 border-line bg-paper-raised px-4 py-2.5 text-ink',
            p.rank === 1 && 'border-amber',
          )}
        >
          <span className="w-7 font-display text-ink-soft">#{p.rank}</span>
          <Avatar src={p.avatar} name={p.name} className="h-9 w-9" />
          <span className="flex-1 truncate font-semibold">{p.name}</span>
          <span className="font-display text-amber">{p.score}</span>
        </div>
      ))}
    </div>
  );
}

/** Lobby: everyone who has joined so far, with their avatar. */
export function PlayerGrid({ players }: { players: { id: string; name: string; avatar: string }[] }) {
  if (players.length === 0) {
    return (
      <p className="text-center text-sm text-ink-soft">
        Тоглогчид нэгдэхийг хүлээж байна...
      </p>
    );
  }
  return (
    <div className="flex w-full max-w-155 flex-wrap justify-center gap-3">
      {players.map((p) => (
        <div
          key={p.id}
          className="flex w-24 flex-col items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-2 py-3 text-ink shadow-sm"
        >
          <Avatar src={p.avatar} name={p.name} className="h-14 w-14" />
          <span className="w-full truncate text-center text-xs font-semibold">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

const PODIUM = {
  1: { height: 'h-32', tone: 'bg-amber', medal: '🥇' },
  2: { height: 'h-24', tone: 'bg-ink-soft', medal: '🥈' },
  3: { height: 'h-20', tone: 'bg-[#b45309]', medal: '🥉' },
} as const;

/** Top three of a finished game on a podium (2nd, 1st, 3rd from the left). */
export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;
  const arranged = [top[1], top[0], top[2]].filter((r): r is LeaderboardRow => !!r);
  return (
    <div className="flex w-full max-w-155 items-end justify-center gap-3" aria-label="Тэргүүлэгчид">
      {arranged.map((p) => {
        const style = PODIUM[p.rank as 1 | 2 | 3];
        return (
          <div key={p.id} className="flex w-28 flex-col items-center max-sm:w-24">
            <span className="text-2xl" aria-hidden>{style.medal}</span>
            <Avatar
              src={p.avatar}
              name={p.name}
              className={cx('rounded-full border-4 border-paper-raised shadow-md', p.rank === 1 ? 'h-20 w-20' : 'h-14 w-14')}
            />
            <p className="mt-1.5 w-full truncate text-center text-sm font-bold text-ink">{p.name}</p>
            <p className="font-display text-amber">{p.score}</p>
            <div
              className={cx(
                'mt-2 flex w-full items-start justify-center rounded-t-lg pt-2 font-display text-3xl text-white',
                style.height,
                style.tone,
              )}
            >
              {p.rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CONFETTI_COLORS = ['#2563eb', '#ea580c', '#db2777', '#16a34a', '#f59e0b'];

/** A burst of falling confetti (CSS only; off for reduced-motion). */
export function Confetti() {
  return (
    <div aria-hidden className="confetti pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.18}s`,
            animationDuration: `${2.8 + (i % 5) * 0.5}s`,
            width: `${6 + (i % 3) * 3}px`,
            height: `${10 + (i % 4) * 3}px`,
          }}
        />
      ))}
    </div>
  );
}
