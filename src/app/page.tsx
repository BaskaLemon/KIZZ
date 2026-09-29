'use client';

import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Gamepad2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Shell, TwoColumn, View } from '@/components/Shell';
import { Button, Card, LinkButton } from '@/components/ui';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StreakCard } from '@/components/StreakCard';
import { useAuth } from '@/lib/auth';
import { useAvatar } from '@/hooks/useAvatar';
import { useMyStats } from '@/hooks/useMyStats';

const STEPS = [
  {
    icon: FileText,
    title: '1. Тэмдэглэ',
    text: 'Юу ч сурч байгаагаа бич: хичээл, ном, ажлын мэдлэг, хобби. PDF, зураг хавсаргаж болно.',
    bg: 'bg-answer-1',
  },
  {
    icon: Sparkles,
    title: '2. Сорил болго',
    text: 'Тэмдэглэлээсээ нэг товшилтоор олон сонголттой асуулт үүсгэ (AI эсвэл дүрэмт).',
    bg: 'bg-answer-2',
  },
  {
    icon: Gamepad2,
    title: '3. Тогло',
    text: 'Найзуудтайгаа кодоор шууд тоглоод өрсөлд. Оноо, streak цуглуулж дэлгүүрээс авалцаарай.',
    bg: 'bg-answer-3',
  },
];

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
];

function Landing() {
  return (
    <View>
      <section className="max-w-3xl">
        <span className="inline-block rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
          Хэн ч, юу ч сурахад
        </span>
        <h1 className="mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight text-ink max-sm:text-4xl">
          Сурсан зүйлээ
          <br />
          сорил болгоод, тоглоод бэхжүүл.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          KIZZ бол сурагч, оюутан, ажилтан, өөрөө сурч байгаа хэн бүхэнд зориулсан
          суралцах газар. Тэмдэглэлээ бич, нэг товшилтоор quiz болго, найзуудтайгаа
          өрсөлдөж тогло.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <LinkButton href="/login?mode=signup" variant="primary" size="lg">
            Бүртгүүлэх <ArrowRight size={16} />
          </LinkButton>
          <LinkButton href="/login" variant="ghost" size="lg">
            Нэвтрэх
          </LinkButton>
        </div>
      </section>

      <section className="mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className={`rounded-3xl p-6 text-white shadow-sm ${s.bg}`}
            >
              <Icon size={26} />
              <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {s.text}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-paper-raised p-6">
        <h2 className="text-xl font-bold text-ink">Ганцаараа ч, хамтдаа ч</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Тэмдэглэл, quiz нь анхнаасаа зөвхөн танд харагдана. Хүсвэл бүлэг үүсгээд
          кодоо найзууддаа өгч, хамтдаа тэмдэглэл хөтлөх, даалгавар өгөх, дүнгээ
          харах боломжтой.
        </p>
      </section>
    </View>
  );
}

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

export default function HomePage() {
  const { user, ready } = useAuth();

  return (
    <Shell activePath="/">
      {!ready ? <LoadingScreen /> : user ? <Dashboard /> : <Landing />}
    </Shell>
  );
}
