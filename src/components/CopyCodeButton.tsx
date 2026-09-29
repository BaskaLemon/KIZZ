'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useToast } from '@/lib/toast';

/** Small "code + copy" control shared by the class list cards (light card
 * background) and the class detail banner (colored background). */
export function CopyCodeButton({
  code,
  tone = 'light',
}: {
  code: string;
  tone?: 'light' | 'dark';
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast('Код хуулагдлаа');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Хуулж чадсангүй', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Кодыг хуулах"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1 text-[13px] font-semibold transition-colors',
        tone === 'light'
          ? 'border-line text-ink-soft hover:border-ink hover:text-ink'
          : 'border-white/40 text-white hover:border-white hover:bg-white/10',
      )}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {code}
    </button>
  );
}
