'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Gamepad2,
  Store,
  Users,
} from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Shell, TwoColumn, View } from '@/components/Shell';
import { Button, Card } from '@/components/ui';
import { StreakCard } from '@/components/StreakCard';
import { useAuth } from '@/lib/auth';
import { useAvatar } from '@/hooks/useAvatar';
import { useMyStats } from '@/hooks/useMyStats';

const ACTIONS = [
  {
    href: '/notes',
    icon: FileText,
    title: 'Тэмдэглэл бичих',
    text: 'Шинэ тэмдэглэл үүсгэх эсвэл үргэлжлүүлэх',
    bg: 'bg-answer-1',
  },
  {
    href: '/play',
    icon: Gamepad2,
    title: 'Quiz тоглох',
    text: 'Өөрийн quiz-ээ эхлүүлэх эсвэл кодоор нэгдэх',
    bg: 'bg-answer-3',
  },
  {
    href: '/classroom',
    icon: Users,
    title: 'Бүлгүүд',
    text: 'Найз, багийнхантайгаа хамт суралцах',
    bg: 'bg-answer-4',
  },
  {
    href: '/shop',
    icon: Store,
    title: 'Дэлгүүр',
    text: 'Kizz Coin-оороо шинэ аватар авч, өмс',
    bg: 'bg-answer-2',
  },
];

function Dashboard() {
  const { user, logout } = useAuth();
  const { avatarUri } = useAvatar();
  const stats = useMyStats(!!user);

  const statItems = [
    { label: 'Тэмдэглэл', value: stats?.notes },
    { label: 'Quiz', value: stats?.quizzes },
    { label: 'Бүлэг', value: stats?.groups },
  ];
  const isNew = stats !== null && stats.notes === 0 && stats.quizzes === 0;

  return (
    <TwoColumn
      main={
        <View>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink max-sm:text-3xl">
            Сайн уу, {user?.name}!
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
            {isNew
              ? 'Эхний тэмдэглэлээ бичээд, тэндээс quiz үүсгэж үзээрэй.'
              : 'Өнөөдөр юу сурах вэ?'}
          </p>

          <div className="mt-6 grid max-w-3xl grid-cols-3 gap-3 max-sm:grid-cols-1">
            {statItems.map((s) => (
              <Card key={s.label} className="rounded-2xl">
                <p className="text-sm font-medium text-ink-soft">{s.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-ink">
                  {s.value ?? '–'}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex flex-col justify-between rounded-3xl p-6 text-white shadow-sm transition-transform hover:-translate-y-0.5 ${a.bg}`}
                >
                  <div>
                    <Icon size={24} />
                    <h3 className="mt-3 text-2xl font-bold">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/90">
                      {a.text}
                    </p>
                  </div>
                  <span className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                    Нээх <ArrowRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        </View>
      }
      side={
        <div className="flex flex-col gap-5">
          <Card className="text-center">
            <Link href="/profile" className="block">
              <img
                src={avatarUri}
                alt="Профайлын зураг"
                className="mx-auto h-16 w-16 rounded-full bg-bold-quiz transition-opacity hover:opacity-80"
              />
              <p className="mt-3 text-base font-bold text-ink hover:underline">
                {user?.name}
              </p>
            </Link>
            <Button variant="ghost" block className="mt-5" onClick={logout}>
              Гарах
            </Button>
          </Card>
          <StreakCard />
        </div>
      }
    />
  );
}

/** `landing` is passed in from the server component so it is rendered into
 * the initial HTML (SEO) and shown to signed-out visitors. */
export default function HomeClient({ landing }: { landing: ReactNode }) {
  const { user } = useAuth();

  // Tells global.css hydration is done, so it stops masking the landing.
  useEffect(() => {
    document.documentElement.dataset.ready = '1';
  }, []);

  return (
    <Shell activePath="/">
      {user ? (
        <Dashboard />
      ) : (
        <>
          <div className="landing-wrap">{landing}</div>
          <div className="auth-splash">
            <LoadingScreen />
          </div>
        </>
      )}
    </Shell>
  );
}
