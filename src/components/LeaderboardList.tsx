'use client';

import { avatarSrcFor } from '@/lib/avatar';
import { cx } from '@/lib/cx';
import type { LeaderboardEntry } from '@/lib/types';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Ranked list of people by XP. */
export function LeaderboardList({
  rows,
  compact = false,
}: {
  rows: LeaderboardEntry[];
  compact?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li
          key={r.id}
          className={cx(
            'flex items-center gap-3 rounded-xl border px-3 py-2',
            r.isMe ? 'border-violet bg-violet/10' : 'border-line bg-paper-raised',
          )}
        >
          <span className="w-8 shrink-0 text-center font-display text-lg text-ink-soft">
            {MEDAL[r.rank] ?? `#${r.rank}`}
          </span>
          <img
            src={avatarSrcFor(r)}
            alt=""
            className={cx('shrink-0 rounded-full object-cover', compact ? 'h-8 w-8' : 'h-10 w-10')}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">
              {r.name}
              {r.isMe && <span className="ml-1.5 text-xs font-semibold text-violet">(та)</span>}
            </p>
            {!compact && <p className="text-xs text-ink-soft">{r.level}-р түвшин</p>}
          </div>
          <span className="shrink-0 font-display text-amber">{r.xp} XP</span>
        </li>
      ))}
    </ol>
  );
}
