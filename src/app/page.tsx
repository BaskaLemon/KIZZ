'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Shell, TwoColumn, View } from '@/components/Shell';
import { Button, Card, LinkButton } from '@/components/ui';
import { StreakCard } from '@/components/StreakCard';
import { useAuth } from '@/lib/auth';
import { useAvatar } from '@/hooks/useAvatar';

type FilterKey = 'all' | 'study' | 'quiz' | 'game' | 'class';

const FILTERS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: 'all', label: 'Бүгд' },
  { key: 'study', label: 'Судлах', dot: 'bg-answer-1' },
  { key: 'quiz', label: 'Quiz', dot: 'bg-answer-2' },
  { key: 'game', label: 'Тоглоом', dot: 'bg-answer-3' },
  { key: 'class', label: 'Анги', dot: 'bg-answer-4' },
];

const MODES: {
  key: FilterKey;
  badge: string;
  title: string;
  description: string;
  bg: string;
  href?: string;
}[] = [
  {
    key: 'study',
    badge: 'Хамтарсан',
    title: 'Хамтын тэмдэглэл',
    description:
      'Групптэйгээ нэг тэмдэглэл дээр real-time хамтран ажилла. Хэн идэвхтэй байгааг харна.',
    bg: 'bg-answer-1',
    href: '/notes',
  },
  {
    key: 'quiz',
    badge: 'AI ашигладаг',
    title: 'Сорил үүсгэх',
    description:
      'Дурын тэмдэглэлээ сонгоод AI-аар (эсвэл дүрэмт аргаар) олон сонголттой асуулт үүсгэ.',
    bg: 'bg-answer-2',
  },
  {
    key: 'game',
    badge: 'Шууд',
    title: 'Шууд тоглоом',
    description:
      'Сорилоо өрсөлдөөн болго — өрөөний код, таймер, хурдны онооны самбар.',
    bg: 'bg-answer-3',
  },
  {
    key: 'class',
    badge: 'Багш/сурагч',
    title: 'Ангийн танхим',
    description:
      'Багш даалгавар өгч, сурагч цагаараа хийж, багш дүнгийн самбараа хардаг.',
    bg: 'bg-answer-4',
  },
];

function roleLabel(role: 'teacher' | 'student') {
  return role === 'teacher' ? 'Багш' : 'Сурагч';
}

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const { user, ready, logout } = useAuth();
  const { avatarUri } = useAvatar();

  const visibleModes =
    activeFilter === 'all'
      ? MODES
      : MODES.filter((m) => m.key === activeFilter);

  return (
    <Shell activePath="/">
      <TwoColumn
        main={
          <View>
            <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.1] tracking-tight text-ink">
              Хамт судал.
              <br />
              Сорил болго.
              <br />
              Тоглоод бэхжүүл.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
              KIZZ бол групп тэмдэглэл, AI сорил, шууд сорил
              тоглоом нэг дор.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line bg-paper-raised text-ink hover:border-ink/25'
                    }`}
                  >
                    {f.dot && (
                      <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                    )}
                    {f.label}
                  </button>
                );
              })}
            </div>

            <h2 className="mt-10 text-lg font-bold text-ink"></h2>

            <div className="mt-4 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
              {visibleModes.map((mode) => (
                <div
                  key={mode.key}
                  className={`flex flex-col justify-between rounded-3xl p-6 text-white shadow-sm ${mode.bg}`}
                >
                  <div>
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      {mode.badge}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold">{mode.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/90">
                      {mode.description}
                    </p>
                  </div>
                  {mode.href ? (
                    <Link
                      href={mode.href}
                      className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
                    >
                      Нээх <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
                      Нээх <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </View>
        }
        side={
          <div className="flex flex-col gap-5">
            {!ready ? null : user ? (
              <Card className="text-center">
                <Link href="/profile" className="block">
                  <img
                    src={avatarUri}
                    alt="Профайлын зураг"
                    className="mx-auto h-16 w-16 rounded-full bg-bold-quiz transition-opacity hover:opacity-80"
                  />
                  <p className="mt-3 text-base font-bold text-ink hover:underline">
                    {user.name}
                  </p>
                </Link>
                <span className="mt-2 inline-block rounded-full bg-mint px-3 py-1 text-xs font-semibold text-white">
                  {roleLabel(user.role)}
                </span>
                <Button variant="ghost" block className="mt-5" onClick={logout}>
                  Гарах
                </Button>
              </Card>
            ) : null}

            {!ready ? null : user ? (
              <StreakCard />
            ) : (
              <Card className="text-center">
                <p className="text-base font-bold text-ink">Нэвтрээгүй байна</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Ангиуд, тэмдэглэл, quiz ашиглахын тулд бүртгэл хийх
                  шаардлагатай.
                </p>
                <LinkButton
                  href="/login"
                  variant="primary"
                  block
                  className="mt-4"
                >
                  Нэвтрэх / Бүртгүүлэх
                </LinkButton>
              </Card>
            )}

            <Card>
              <p className="text-sm font-medium text-ink-soft">Миний ангиуд</p>
              <p className="mt-1 text-4xl font-extrabold text-ink">0</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Ангийн танхим руу орж кодоор нэгдээрэй.
              </p>
              <LinkButton
                href="/classroom"
                variant="mint"
                block
                className="mt-4"
              >
                Ангийн танхим руу <ArrowRight size={15} />
              </LinkButton>
            </Card>
          </div>
        }
      />
    </Shell>
  );
}
