import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from './ui';
import { cx } from '@/lib/cx';
import type { LeaderboardRow } from '@/lib/types';

export const SHAPES = ['triangle', 'diamond', 'circle', 'square'] as const;
const ANSWER_BG = ['bg-answer-1', 'bg-answer-2', 'bg-answer-3', 'bg-answer-4'];
const ANSWER_TEXT = ['text-white', 'text-white', 'text-ink', 'text-ink'];

export function StageScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-stage p-8 text-stage-text">
      {children}
    </div>
  );
}

export function StageHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-5 flex w-full max-w-225 items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-[22px] font-semibold text-stage-text no-underline"
      >
        <BrandMark border="stage-text" />
        KIZZ
      </Link>
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
    <div className="rounded-lg border-3 border-violet bg-stage-raised px-8 py-8 text-center shadow-[6px_6px_0_var(--color-violet-dark)]">
      <p className="text-sm font-semibold text-stage-text-soft">{label}</p>
      <p className="my-2 font-display text-[64px] tracking-[10px] text-stage-text max-md:text-[40px] max-md:tracking-[6px]">
        {code}
      </p>
      {hint && <p className="text-sm text-stage-text-soft">{hint}</p>}
    </div>
  );
}

export function TimerRing({ seconds }: { seconds: number }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border-5 border-amber font-display text-xl">
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
  onClick?: () => void;
}

export function AnswerOption({
  index,
  label,
  interactive = true,
  disabled,
  dimmed,
  chosen,
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
        ANSWER_TEXT[index],
        !interactive && 'cursor-default',
        dimmed && 'opacity-35',
        chosen && 'outline outline-4 outline-white',
      )}
    >
      <span
        className={cx(
          'h-6.5 w-6.5 shrink-0 bg-white/90',
          `shape-${SHAPES[index]}`,
        )}
      />
      <span>{label}</span>
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

export function AnswerBars({
  options,
  optionCounts,
  correctIndex,
}: {
  options: string[];
  optionCounts: number[];
  correctIndex: number;
}) {
  const maxCount = Math.max(1, ...optionCounts);
  return (
    <div className="flex w-full max-w-225 flex-col gap-2.5">
      {options.map((opt, i) => {
        const pct = Math.round((optionCounts[i] / maxCount) * 100);
        const isCorrect = i === correctIndex;
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className={cx(
                'h-5.5 w-5.5 shrink-0 bg-white/90',
                `shape-${SHAPES[i]}`,
              )}
            />
            <div
              className={cx(
                'h-8.5 flex-1 overflow-hidden rounded-lg bg-stage-raised',
                isCorrect && 'outline outline-3 outline-mint',
              )}
            >
              <div
                className={cx(
                  'flex h-full items-center justify-end px-2.5 font-bold text-white',
                  ANSWER_BG[i],
                )}
                style={{ width: `${pct}%` }}
              >
                {optionCounts[i]}
              </div>
            </div>
            <span className="min-w-30">
              {opt}
              {isCorrect ? ' ✓' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="flex w-full max-w-155 flex-col gap-2">
      {rows.map((p) => (
        <div
          key={p.id}
          className={cx(
            'flex items-center justify-between rounded-sm border-2 border-transparent bg-stage-raised px-4.5 py-3',
            p.rank === 1 && 'border-amber',
          )}
        >
          <span className="w-7 font-display text-stage-text-soft">
            #{p.rank}
          </span>
          <span className="ml-2.5 flex-1 font-semibold">{p.name}</span>
          <span className="font-display text-amber">{p.score}</span>
        </div>
      ))}
    </div>
  );
}
