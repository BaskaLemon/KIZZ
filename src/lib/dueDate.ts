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
