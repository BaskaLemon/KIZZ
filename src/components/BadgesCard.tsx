'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { cx } from '@/lib/cx';
import type { BadgeItem } from '@/lib/types';

/** Every badge, earned ones in colour, locked ones greyed with how to earn. */
export function BadgesCard() {
  const [badges, setBadges] = useState<BadgeItem[] | null>(null);

  useEffect(() => {
    api
      .getMyBadges()
      .then((res) => setBadges(res.badges))
      .catch(() => setBadges([]));
  }, []);

  if (!badges) return null;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Миний тэмдгүүд</h2>
        <span className="text-sm font-semibold text-ink-soft">
          {earned} / {badges.length}
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {badges.map((b) => (
          <li
            key={b.key}
            title={b.earned ? `${b.name} — ${b.hint}` : `Түгжээтэй: ${b.hint}`}
            className={cx(
              'flex flex-col items-center rounded-2xl border px-2 py-3 text-center',
              b.earned ? 'border-violet/40 bg-violet/10' : 'border-line opacity-60',
            )}
          >
            <span className={cx('text-3xl', !b.earned && 'grayscale')} aria-hidden>
              {b.emoji}
            </span>
            <p className="mt-1.5 text-xs font-bold text-ink">{b.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
              {b.earned ? 'Авсан ✓' : b.hint}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
