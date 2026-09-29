'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Home, FileText, Bot, GraduationCap, Store } from 'lucide-react';
import { useAvatar } from '@/hooks/useAvatar';
import { cx } from '@/lib/cx';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { path: '/', icon: Home, label: 'Нүүр', href: '/' },
  { path: '/notes', icon: FileText, label: 'Тэмдэглэл', href: '/notes' },
  { path: '/play', icon: Bot, label: 'Тоглоом', href: '/play' },
  { path: '/classroom', icon: GraduationCap, label: 'Ангийн танхим', href: '/classroom' },
  { path: '/shop', icon: Store, label: 'Дэлгүүр', href: '/shop' },
];

export function Shell({
  activePath,
  children,
}: {
  activePath: string;
  children: ReactNode;
}) {
  const { avatarUri } = useAvatar();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-0.5 border-b border-line bg-paper-raised/90 px-2 backdrop-blur sm:h-16 sm:gap-1 sm:px-3 md:px-5">
        <Link
          href="/profile"
          title="Профайл"
          className="mr-1 block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-line transition-all hover:ring-violet/40 sm:mr-2 sm:h-9 sm:w-9"
        >
          <img src={avatarUri} alt="Профайлын зураг" className="h-full w-full object-cover" />
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.path;
            const className = cx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors duration-150 hover:bg-ink/5 hover:text-ink sm:h-10 sm:w-10',
              active && 'bg-violet/10 text-violet hover:bg-violet/10 hover:text-violet',
            );
            return (
              <Link key={item.path} href={item.href} title={item.label} className={className}>
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </header>
      <div className="min-w-0">{children}</div>
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
      <div className="w-80 shrink-0 py-8 pr-8 max-lg:w-full max-lg:px-8 max-lg:pb-8 max-lg:pt-0">
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
        'mx-auto p-8',
        narrow ? 'max-w-170' : 'max-w-270',
        className,
      )}
    >
      {children}
    </div>
  );
}
