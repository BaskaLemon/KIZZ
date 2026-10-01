import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { View } from '@/components/Shell';
import { LinkButton } from '@/components/ui';
import {
  ACCESSORIES,
  avatarOptionsForUser,
  generateAvatarUri,
} from '@/lib/avatar';

// A few fixed, varied looks to show what the avatar maker can do. Fixed seeds
// keep the server-rendered HTML stable.
const SAMPLE_AVATARS = ['kizz-a', 'kizz-b', 'kizz-c', 'kizz-d', 'kizz-e'].map(
  (seed, i) =>
    generateAvatarUri({
      ...avatarOptionsForUser(seed),
      accessory: ACCESSORIES[(i * 2 + 1) % ACCESSORIES.length],
    }),
);

const STEPS = [
  {
    icon: FileText,
    title: 'Тэмдэглэ',
    text: 'Хичээл, ном, ажлын тэмдэглэл, хобби гээд сурч буй бүхнээ бичээрэй. PDF, зураг хавсаргахад л хангалттай!',
    bg: 'bg-answer-1',
  },
  {
    icon: Sparkles,
    title: 'Сорил болго',
    text: 'Ганц товшилтоор тэмдэглэлээ AI-аар сорил болго.',
    bg: 'bg-answer-2',
  },
  {
    icon: Gamepad2,
    title: 'Тогло',
    text: 'Кодоор өрөөндөө нэгдэж, найзуудтайгаа өрсөлдөж, оноо, XP цуглуулан түвшин ахиарай!',
    bg: 'bg-answer-3',
  },
];

/** Server-rendered marketing page — no hooks, so it is part of the HTML
 * crawlers see. */
export function Landing() {
  return (
    <View>
      <section className="max-w-3xl">
        <span className="inline-block rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
          Сурах хэзээ ч ийм хөгжилтэй байгаагүй
        </span>
        <h1 className="mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight text-ink max-sm:text-4xl">
          KIZZ – <span className="text-violet">Өөрийгөө сорь</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          KIZZ бол сурагч, оюутан, ажилтан гээд шинийг сурч мэдэхийг хүссэн хэн
          бүхэнд зориулсан ухаалаг сургалтын платформ юм. Хичээлийн эсвэл
          ажлын тэмдэглэлээ хялбархан бичиж оруулаад, ганцхан товшилтоор мэдлэг
          сорил (quiz) болгон хувиргаарай. Найзуудтайгаа өрсөлдөж, хөгжилтэй
          байдлаар тоглонгоо сурах шинэ боломжийг танд олгоно.
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

      <section className="mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-8 rounded-3xl bg-gradient-to-br from-[#16a34a] to-[#0d6b31] p-8 text-white shadow-sm max-sm:p-6">
        <div className="min-w-0 max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            Аватараа кастомайз хийж, онцгойр
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            Загвар, өнгөө сонгож өөрийн гэсэн цорын ганц дүрийг бүтээ! Kizz
            Coin-оо ашиглан дэлгүүрээс шинэ аватар худалдаж авч бусдаас
            ялгараарай!
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black no-underline transition-transform hover:-translate-y-0.5"
          >
            Дүрээ бүтээх <ArrowRight size={15} />
          </Link>
        </div>
        <div className="flex items-center pl-3" aria-hidden>
          {SAMPLE_AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="-ml-5 h-20 w-20 rounded-full border-4 border-white/90 bg-white object-cover shadow-md first:ml-0 max-sm:h-14 max-sm:w-14 max-sm:-ml-3"
              style={{ transform: `translateY(${i % 2 === 0 ? 0 : 14}px)` }}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 max-w-3xl rounded-3xl border border-line bg-paper-raised p-6">
        <h2 className="text-xl font-bold text-ink">Ганцаараа ч, найзуудтайгаа ч</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Таны тэмдэглэл, quiz зөвхөн танд л харагдах хувийн орон зай байх болно.
          Харин хамтдаа суралцахыг хүсвэл бүлэг үүсгэн кодоо хуваалцаарай.
          Найзуудтайгаа хамт тэмдэглэл хөтөлж, бие биедээ даалгавар өгч, дүн
          тавин хамтдаа хөгжөөрөй.
        </p>
      </section>
      <footer className="mt-12 flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[13px] text-ink-soft">
        <span>© 2026 KIZZ, Inc.</span>
        <nav aria-label="Нэмэлт холбоос" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-ink hover:underline">
            Бидний тухай
          </Link>
          <Link href="/contact" className="hover:text-ink hover:underline">
            Холбоо барих
          </Link>
          <Link href="/terms" className="hover:text-ink hover:underline">
            Үйлчилгээний нөхцөл
          </Link>
          <Link href="/privacy" className="hover:text-ink hover:underline">
            Нууцлалын бодлого
          </Link>
        </nav>
      </footer>
    </View>
  );
}
