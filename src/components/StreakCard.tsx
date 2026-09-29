'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { AnimatedCoin } from '@/components/AnimatedCoin';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ApiError, type BalanceInfo, type StreakStatus } from '@/lib/types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function StreakCard() {
  const toast = useToast();
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadBalance = useCallback(
    () => api.getBalance().then(setBalance),
    [],
  );

  useEffect(() => {
    Promise.all([api.getStreakStatus(), loadBalance()])
      .then(([streakRes]) => setStatus(streakRes))
      .catch((err) => toast(errorMessage(err, 'Урамшууллын мэдээлэл ачаалж чадсангүй'), 'error'));
  }, [toast, loadBalance]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const result = await api.claimStreak();
      await loadBalance();
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              currentStreak: result.streakDay,
              longestStreak: Math.max(prev.longestStreak, result.streakDay),
              lastClaimedDate: new Date().toISOString().slice(0, 10),
              canClaimToday: false,
            }
          : prev,
      );
      toast(`+${result.pointsAwarded} Buzz Coin авлаа! 🔥 ${result.streakDay}-р өдөр`);
    } catch (err) {
      toast(errorMessage(err, 'Урамшуулал авахад алдаа гарлаа'), 'error');
    } finally {
      setClaiming(false);
    }
  }

  const xpPct = balance ? Math.round((balance.xpIntoLevel / balance.xpForNextLevel) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-white">
          Lvl {balance ? balance.level : '—'}
        </span>
        <span className="text-sm font-bold text-ink">
          {balance ? <AnimatedCoin value={balance.balance} /> : '—'}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
          <span>XP</span>
          <span>
            {balance ? balance.xpIntoLevel : 0} / {balance ? balance.xpForNextLevel : '—'}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-mint transition-all"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl leading-none">🔥</span>
        <div>
          <p className="text-lg font-extrabold text-ink">
            {status ? status.currentStreak : '—'} өдөр дараалан
          </p>
          {status && status.longestStreak > status.currentStreak && (
            <p className="text-xs text-ink-soft">Дээд амжилт: {status.longestStreak} өдөр</p>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        block
        className="mt-4"
        disabled={!status || !status.canClaimToday || claiming}
        onClick={handleClaim}
      >
        {!status
          ? 'Ачааллаж байна...'
          : claiming
            ? 'Авч байна...'
            : status.canClaimToday
              ? `Урамшуулал авах (+${status.nextRewardPoints} Buzz Coin)`
              : 'Өнөөдөр аль хэдийн авсан ✓'}
      </Button>
    </Card>
  );
}
