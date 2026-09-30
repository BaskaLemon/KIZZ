'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive action: the confirm button is styled as a warning. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** A styled replacement for `window.confirm`: `await confirm({ message })`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(opts);
    });
  }, []);

  function settle(ok: boolean) {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal onClose={() => settle(false)} label={options.title ?? 'Баталгаажуулах'} className="max-w-sm">
          {options.title && <h2 className="text-lg font-bold text-ink">{options.title}</h2>}
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{options.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => settle(false)}>
              {options.cancelLabel ?? 'Болих'}
            </Button>
            <Button
              variant={options.danger ? 'ghost' : 'primary'}
              className={options.danger ? 'border-coral text-coral' : undefined}
              onClick={() => settle(true)}
            >
              {options.confirmLabel ?? (options.danger ? 'Устгах' : 'Тийм')}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
