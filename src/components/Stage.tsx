import type { ReactNode } from 'react';
import { Shell } from './Shell';
import { cx } from '@/lib/cx';
import type { LeaderboardRow } from '@/lib/types';

export const LETTERS = ['A', 'B', 'C', 'D'] as const;
const ANSWER_BG = ['bg-answer-1', 'bg-answer-2', 'bg-answer-3', 'bg-answer-4'];

/** Game screens live inside the regular app shell (header, nav, theme). */
export function StageScreen({ children }: { children: ReactNode }) {
  return (
    <Shell activePath="/play">
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
