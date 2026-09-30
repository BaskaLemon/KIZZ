'use client';

import { useEffect } from 'react';
import { Shell, View } from '@/components/Shell';
import { Button, LinkButton } from '@/components/ui';

/** Route-level error boundary: a friendly page instead of a blank screen. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Shell activePath="">
      <View narrow className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-5xl" aria-hidden>
          😵
        </p>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">Алдаа гарлаа</h1>
        <p className="mt-2 max-w-sm text-ink-soft">
          Ямар нэг зүйл буруу боллоо. Дахин оролдоод үзээрэй, үргэлжилбэл түр хүлээгээд ирээрэй.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Дахин оролдох
          </Button>
          <LinkButton href="/" variant="ghost">
            Нүүр хуудас
          </LinkButton>
        </div>
      </View>
    </Shell>
  );
}
