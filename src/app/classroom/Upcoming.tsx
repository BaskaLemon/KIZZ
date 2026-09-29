'use client';

import { CalendarClock } from 'lucide-react';
import { dueInfo } from '@/lib/dueDate';
import type { Assignment } from '@/lib/types';

export function Upcoming({
  assignments,
  isTeacher,
}: {
  assignments: Assignment[];
  isTeacher: boolean;
}) {
  const upcoming = assignments
    .filter(
      (a): a is Assignment & { dueAt: string } =>
        !!a.dueAt && !dueInfo(a.dueAt).overdue,
    )
    .filter((a) => isTeacher || !a.mySubmission)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 3);

  return (
    <div className="rounded-md border-[2.5px] border-ink bg-paper-raised p-5 shadow-pop-md">
      <h3 className="text-[17px] font-bold text-ink">Ойрын хугацаа</h3>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-[13px] text-ink-soft">Удахгүй дуусах даалгавар алга</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {upcoming.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5">
              <CalendarClock size={15} className="shrink-0 text-ink-soft" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">
                  {a.title}
                </p>
                <p className="text-[12px] text-ink-soft">{dueInfo(a.dueAt).label}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
