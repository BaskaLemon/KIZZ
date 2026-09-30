import { Shell, View } from '@/components/Shell';
import { LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <Shell activePath="">
      <View narrow className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-display text-7xl font-extrabold text-violet">404</p>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">Хуудас олдсонгүй</h1>
        <p className="mt-2 max-w-sm text-ink-soft">
          Таны хайсан хуудас байхгүй эсвэл устсан байна.
        </p>
        <LinkButton href="/" variant="primary" className="mt-6">
          Нүүр хуудас руу →
        </LinkButton>
      </View>
    </Shell>
  );
}
