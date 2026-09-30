'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { avatarSrcFor, generateAvatarUri, avatarOptionsForUser } from '@/lib/avatar';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/cx';
import { useToast } from '@/lib/toast';
import type { ApiError, ShopItem } from '@/lib/types';

/** "My avatars": the customized one plus every shop avatar the user owns.
 * Clicking one wears it — it then shows everywhere in the app. */
export function AvatarPicker() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [owned, setOwned] = useState<ShopItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .getInventory()
      .then((res) => setOwned(res.items.filter((i) => i.category === 'avatarPreset')))
      .catch(() => setOwned([]));
  }, [user]);

  if (!user) return null;

  async function wear(itemId: string | null) {
    setBusy(itemId ?? 'custom');
    try {
      await api.equipAvatar(itemId);
      updateUser({ equippedItemId: itemId });
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Аватар сольж чадсангүй', 'error');
    } finally {
      setBusy(null);
    }
  }

  const customSrc = generateAvatarUri(user.avatarOptions ?? avatarOptionsForUser(user.id));
  const choices: { key: string | null; label: string; src: string }[] = [
    { key: null, label: 'Миний тохируулсан', src: customSrc },
    ...(owned ?? []).map((i) => ({
      key: i.id,
      label: i.name.replace(/ аватар$/, ''),
      src: avatarSrcFor({ id: user.id, equippedItemId: i.id }),
    })),
  ];

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-bold text-ink">Миний аватарууд</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Сонгосон аватар нь бүх газар (цэс, тоглоом, бүлэг) харагдана.
        {owned !== null && owned.length === 0 && ' Дэлгүүрээс шинэ аватар авч болно.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {choices.map((c) => {
          const active = (user.equippedItemId ?? null) === c.key;
          return (
            <button
              key={c.key ?? 'custom'}
              type="button"
              disabled={busy !== null}
              onClick={() => !active && wear(c.key)}
              aria-pressed={active}
              className={cx(
                'relative flex w-24 flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs font-semibold text-ink transition-colors disabled:opacity-60',
                active ? 'border-violet bg-violet/10' : 'border-line hover:border-ink/30',
              )}
            >
              <img src={c.src} alt="" className="h-14 w-14 rounded-full bg-paper object-cover" />
              <span className="w-full truncate text-center">{c.label}</span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
