'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastType = 'info' | 'error';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2 max-sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-sm px-4.5 py-2.5 text-sm font-medium shadow-pop-sm ${
              t.type === 'error' ? 'bg-coral text-white' : 'bg-ink text-paper'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
