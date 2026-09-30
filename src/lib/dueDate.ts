export interface DueInfo {
  label: string;
  overdue: boolean;
}

export function dueInfo(dueAt: string | null): DueInfo {
  if (!dueAt) return { label: 'Хугацаагүй', overdue: false };
  const due = new Date(dueAt);
  const label = `Хугацаа: ${due.toLocaleDateString('mn-MN', {
    month: 'long',
    day: 'numeric',
  })}`;
  return { label, overdue: due.getTime() < Date.now() };
}

/** Parses the `dueAt` a client sends. A plain date ("2026-10-05") means the
 * whole day counts, so it is stored as 23:59:59 Ulaanbaatar time (UTC+8) —
 * otherwise a due date of today would read as overdue from midnight.
 * Returns null for empty input and undefined for an invalid date. */
export function parseDueInput(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59+08:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
