'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CalendarDays, Pencil } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Shell, View } from '@/components/Shell';
import { Button, Card, EmptyState, LinkButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAvatar } from '@/hooks/useAvatar';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';
import { StreakCard } from '@/components/StreakCard';
import { AccountSettings } from '@/components/AccountSettings';
import { useMyStats } from '@/hooks/useMyStats';

function joinedLabel(createdAt: string) {
  const date = new Date(createdAt);
  return `${date.getFullYear()} оны ${date.getMonth() + 1} сард элссэн`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { options, avatarUri, saveOptions, saving } = useAvatar();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const myStats = useMyStats(!!user);
  const STATS = [
    { label: 'Миний бүлгүүд', value: myStats?.groups },
    { label: 'Үүсгэсэн quiz', value: myStats?.quizzes },
    { label: 'Бичсэн тэмдэглэл', value: myStats?.notes },
  ];

  if (!ready)
    return (
      <Shell activePath="/profile">
        <LoadingScreen />
      </Shell>
    );

  if (!user) {
    return (
      <Shell activePath="/profile">
        <View narrow>
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>Профайлаа харахын тулд бүртгэл хийх шаардлагатай.</p>
            <LinkButton href="/login" variant="primary" className="mt-4">
              Нэвтрэх / Бүртгүүлэх →
            </LinkButton>
          </EmptyState>
        </View>
      </Shell>
    );
  }

  return (
    <Shell activePath="/profile">
      <View narrow>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Профайл
        </h1>

        <Card className="mt-8">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setCustomizerOpen(true)}
              aria-label="Аватар тохируулах"
              className="group relative h-20 w-20 flex-shrink-0"
            >
              <img
                src={avatarUri}
                alt="Профайлын зураг"
                className="h-20 w-20 rounded-full bg-bold-quiz transition-opacity group-hover:opacity-80"
              />
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper-raised bg-ink text-paper">
                <Pencil size={13} />
              </span>
            </button>
            <div>
              <p className="text-xl font-bold text-ink">{user.name}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t-2 border-line pt-6 text-sm text-ink-soft">
            <div className="flex items-center gap-2.5">
              <Mail size={16} />
              {user.email}
            </div>
            <div className="flex items-center gap-2.5">
              <CalendarDays size={16} />
              {joinedLabel(user.createdAt)}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => setCustomizerOpen(true)}>
              Профайл засах
            </Button>
            <LinkButton href="/shop" variant="mint">
              Дэлгүүр →
            </LinkButton>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Гарах
            </Button>
          </div>
        </Card>

        <div className="mt-6">
          <StreakCard />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-5">
          {STATS.map((stat) => (
            <Card key={stat.label}>
              <p className="text-4xl font-extrabold text-ink">
                {stat.value ?? '–'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {stat.label}
              </p>
            </Card>
          ))}
        </div>
        <AccountSettings />
      </View>

      <AvatarCustomizer
        open={customizerOpen}
        initial={options}
        saving={saving}
        onClose={() => setCustomizerOpen(false)}
        onSave={async (next) => {
          await saveOptions(next);
          setCustomizerOpen(false);
        }}
      />
    </Shell>
  );
}
