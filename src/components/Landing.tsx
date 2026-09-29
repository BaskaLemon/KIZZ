import {
  ArrowRight,
  FileText,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { View } from '@/components/Shell';
import { LinkButton } from '@/components/ui';

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

/** Server-rendered marketing page — no hooks, so it is part of the HTML
 * crawlers see. */
export function Landing() {
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
