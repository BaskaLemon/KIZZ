'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/cx';
import { NOTIFICATIONS_REFRESH } from '@/lib/events';
import type { AppNotification } from '@/lib/types';

const POLL_MS = 60_000;

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
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
    // Refetch when the tab regains focus and right after actions that may
    // have created a notification (level-up, ...).
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    window.addEventListener(NOTIFICATIONS_REFRESH, onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(NOTIFICATIONS_REFRESH, onFocus);
    };
  }, [userId, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the slot's size before/without a user so the nav doesn't shift.
  if (!userId) return <div className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" aria-hidden />;

  async function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.markNotificationRead(n.id).catch(() => void load());
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  }

  async function remove(n: AppNotification) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.read) setUnread((u) => Math.max(0, u - 1));
    api.deleteNotification(n.id).catch(() => void load());
  }

  async function markAllRead() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    api.markNotificationsRead().catch(() => void load());
  }

  async function clearAll() {
    if (!window.confirm('Бүх мэдэгдлийг устгах уу?')) return;
    setItems([]);
    setUnread(0);
    api.clearNotifications().catch(() => void load());
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Мэдэгдэл"
        aria-label={unread > 0 ? `Мэдэгдэл (${unread} уншаагүй)` : 'Мэдэгдэл'}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
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
        <div className="absolute right-0 top-full z-50 mt-2 flex max-h-[28rem] w-80 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-lg">
          {items.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40"
              >
                <CheckCheck size={14} /> Бүгдийг уншсан
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-coral/10 hover:text-coral"
              >
                <Trash2 size={14} /> Цэвэрлэх
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-soft">Мэдэгдэл алга</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cx(
                    'group flex items-start gap-1 rounded-xl hover:bg-ink/5',
                    !n.read && 'bg-violet/5',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left"
                  >
                    <p className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                      {!n.read && (
                        <span
                          aria-label="Уншаагүй"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral"
                        />
                      )}
                      <span>{n.title}</span>
                    </p>
                    {n.body && <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-ink-soft/70">
                      {new Date(n.createdAt).toLocaleString('mn-MN')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(n)}
                    aria-label="Мэдэгдлийг устгах"
                    title="Устгах"
                    className="mr-1 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft/60 transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
