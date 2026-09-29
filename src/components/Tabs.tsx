'use client';

import { cx } from '@/lib/cx';

/** Simple segmented pill control — no precedent for tabs elsewhere in the
 * repo, styled to match the filter pills in src/app/page.tsx. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b-2 border-line pb-4">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cx(
              'rounded-full border-2 px-5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-paper-raised text-ink hover:border-ink/30',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
