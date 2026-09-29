'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/cx';
import type { AppNotification } from '@/lib/types';

const POLL_MS = 60_000;

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;

  const load = useCallback(async () => {
    try {
      const data = await api.listNotifications();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Non-critical — keep whatever we last had.
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [userId, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!userId) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.markNotificationsRead();
        setUnread(0);
        // Keep the "unread" styling for this view; refresh on next open.
      } catch {
        /* ignore */
      }
    }
    if (next) void load();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Мэдэгдэл"
        onClick={toggle}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors duration-150 hover:bg-ink/5 hover:text-ink sm:h-10 sm:w-10"
      >
        <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border border-line bg-paper-raised p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-soft">
              Мэдэгдэл алга
            </p>
          ) : (
            items.map((n) => {
              const content = (
                <>
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-ink-soft/70">
                    {new Date(n.createdAt).toLocaleString('mn-MN')}
                  </p>
                </>
              );
              const cls = cx(
                'block rounded-xl px-3 py-2.5 hover:bg-ink/5',
                !n.read && 'bg-violet/5',
              );
              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className={cls}>
                  {content}
                </Link>
              ) : (
                <div key={n.id} className={cls}>
                  {content}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
