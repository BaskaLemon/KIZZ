'use client';

import { useState } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';
import { Gradebook } from './Gradebook';
import type { Assignment } from '@/lib/types';

export function ClassMarks({
  assignments,
  isTeacher,
}: {
  assignments: Assignment[];
  isTeacher: boolean;
}) {
  const [openGradebook, setOpenGradebook] = useState<string | null>(null);

  return (
    <div>
      <h3 className="mb-2.5 text-lg">Дүн</h3>
      {assignments.length === 0 ? (
        <EmptyState title="Даалгавар алга">
          <p>Даалгавар нэмэгдэхэд дүн энд харагдана.</p>
        </EmptyState>
      ) : isTeacher ? (
        <div className="flex flex-col gap-3">
          {assignments.map((a) => (
            <Card key={a.id} className="rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base">{a.title}</h3>
                  <p className="text-[13px] text-ink-soft">
                    {a.submissionCount ?? 0} илгээсэн
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setOpenGradebook(openGradebook === a.id ? null : a.id)
                  }
                >
                  {openGradebook === a.id ? 'Хаах' : 'Дүнгийн самбар'}
                </Button>
              </div>
              {openGradebook === a.id && <Gradebook assignmentId={a.id} />}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((a) => (
            <Card
              key={a.id}
              className="flex items-center justify-between rounded-lg py-3.5"
            >
              <p className="truncate font-medium text-ink">{a.title}</p>
              {a.mySubmission ? (
                a.mySubmission.score === null ? (
                  <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-[13px] font-semibold text-ink-soft">
                    Дүн ороогүй
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-[13px] font-semibold text-white">
                    {a.mySubmission.score}%
                  </span>
                )
              ) : (
                <span className="shrink-0 text-[13px] text-ink-soft">
                  Дүн алга
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
