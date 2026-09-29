// The customizable class-color palette, built from colors already defined
// in global.css (see --color-*) so a custom class color never introduces an
// off-brand hue. Each class stores the *key* (e.g. "blue"), not the
// Tailwind class, keeping the database independent of the CSS framework.
export const CLASS_COLORS = [
  { key: 'blue', label: 'Хөх', className: 'bg-answer-1' },
  { key: 'orange', label: 'Улбар шар', className: 'bg-answer-2' },
  { key: 'pink', label: 'Ягаан', className: 'bg-answer-3' },
  { key: 'green', label: 'Ногоон', className: 'bg-answer-4' },
  { key: 'violet', label: 'Ягаан хөх', className: 'bg-violet' },
  { key: 'mint', label: 'Мента', className: 'bg-mint' },
  { key: 'amber', label: 'Шаргал', className: 'bg-amber' },
  { key: 'coral', label: 'Улаан', className: 'bg-coral' },
] as const;

export type ClassColorKey = (typeof CLASS_COLORS)[number]['key'];

const DEFAULT_CLASS_COLOR_CLASSNAME = CLASS_COLORS[0].className;

export function isClassColorKey(value: unknown): value is ClassColorKey {
  return (
    typeof value === 'string' &&
    CLASS_COLORS.some((c) => c.key === (value as ClassColorKey))
  );
}

/** Tailwind background class for a stored color key. Falls back to the
 * default swatch for anything unrecognized (older rows, bad input). */
export function classBannerClass(color: string | null | undefined): string {
  return (
    CLASS_COLORS.find((c) => c.key === color)?.className ??
    DEFAULT_CLASS_COLOR_CLASSNAME
  );
}

export function randomClassColor(): ClassColorKey {
  return CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)].key;
}
