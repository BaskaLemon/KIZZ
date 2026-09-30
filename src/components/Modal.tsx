'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible dialog: closes on Esc and on clicking the backdrop, locks page
 * scroll, keeps Tab inside, and returns focus to whatever opened it. */
export function Modal({
  onClose,
  label,
  children,
  className,
}: {
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  children: ReactNode;
  /** Extra classes for the panel (e.g. `max-w-2xl`). */
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the mount effect.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first field (skipping the close button), else the panel.
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first =
      Array.from(focusables ?? []).find((el) => el.getAttribute('aria-label') !== 'Хаах') ??
      focusables?.[0];
    (first ?? panel)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        );
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center"
      // mousedown (not click) so dragging a text selection out of the panel
      // doesn't dismiss it
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx(
          'my-auto w-full max-w-lg rounded-3xl border border-line bg-paper-raised p-5 shadow-lg outline-none sm:p-6',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
