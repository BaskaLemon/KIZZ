'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Home, FileText, Gamepad2, Users, Store } from 'lucide-react';
import { useAvatar } from '@/hooks/useAvatar';
import { cx } from '@/lib/cx';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { path: '/', icon: Home, label: 'Нүүр', href: '/' },
  { path: '/notes', icon: FileText, label: 'Тэмдэглэл', href: '/notes' },
  { path: '/play', icon: Gamepad2, label: 'Тоглоом', href: '/play' },
  { path: '/classroom', icon: Users, label: 'Бүлгүүд', href: '/classroom' },
  { path: '/shop', icon: Store, label: 'Дэлгүүр', href: '/shop' },
];

export function Shell({
  activePath,
  children,
  immersive = false,
}: {
  activePath: string;
  children: ReactNode;
  /** Live-game mode: no navigation, so nobody taps away mid-question. */
  immersive?: boolean;
}) {
  const { avatarUri } = useAvatar();

  if (immersive) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-line bg-paper-raised/90 px-3 backdrop-blur">
          <Link
            href="/play"
            className="rounded-full px-3 py-1 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            ← Гарах
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Үндсэн агуулга руу очих
      </a>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-0.5 border-b border-line bg-paper-raised/90 px-2 backdrop-blur sm:h-16 sm:gap-1 sm:px-3 md:px-5">
        <Link
          href="/profile"
          title="Профайл"
          aria-label="Профайл"
          className="mr-1 block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-line transition-all hover:ring-violet/40 sm:mr-2 sm:h-9 sm:w-9"
        >
          <img src={avatarUri} alt="Профайлын зураг" className="h-full w-full object-cover" />
        </Link>
        <nav
          aria-label="Үндсэн цэс"
          className="hidden flex-1 items-center justify-center gap-1 sm:flex"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.path;
            return (
              <Link
                key={item.path}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:bg-ink/5 hover:text-ink md:px-3.5',
                  active && 'bg-violet/10 text-violet hover:bg-violet/10 hover:text-violet',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 sm:hidden" />
        <NotificationBell />
        <ThemeToggle />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none sm:pb-0"
      >
        {children}
      </main>

      <nav
        aria-label="Үндсэн цэс"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold text-ink-soft',
                active && 'text-violet',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function TwoColumn({
  main,
  side,
}: {
  main: ReactNode;
  side: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl items-start max-lg:flex-col">
      <div className="min-w-0 flex-1">{main}</div>
      <div className="w-80 shrink-0 py-8 pr-8 max-lg:w-full max-lg:px-4 max-lg:pb-8 max-lg:pt-0 sm:max-lg:px-8">
        {side}
      </div>
    </div>
  );
}

export function View({
  narrow,
  className,
  children,
}: {
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        'mx-auto p-4 sm:p-8',
        narrow ? 'max-w-170' : 'max-w-270',
        className,
      )}
    >
      {children}
    </div>
  );
}
