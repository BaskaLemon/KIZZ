'use client';

import { CLASS_COLORS, type ClassColorKey } from '@/lib/classColor';
import { cx } from '@/lib/cx';

/** Shared by the create-class form and EditClassDialog. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: ClassColorKey;
  onChange: (color: ClassColorKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CLASS_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          title={c.label}
          aria-label={c.label}
          aria-pressed={value === c.key}
          onClick={() => onChange(c.key)}
          className={cx(
            'h-8 w-8 rounded-full border-2 transition-transform',
            c.className,
            value === c.key
              ? 'border-ink scale-110 shadow-pop-sm'
              : 'border-transparent hover:scale-105',
          )}
        />
      ))}
    </div>
  );
}
