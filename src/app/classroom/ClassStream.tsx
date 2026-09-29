import { Pencil, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import { CopyCodeButton } from '@/components/CopyCodeButton';
import { classBannerClass } from '@/lib/classColor';
import { cx } from '@/lib/cx';
import { Upcoming } from './Upcoming';
import type { Assignment, Class } from '@/lib/types';

export function ClassStream({
  klass,
  assignments,
  isTeacher,
  onEdit,
}: {
  klass: Class;
  assignments: Assignment[];
  isTeacher: boolean;
  onEdit: () => void;
}) {
  const metaLine = [klass.subject, klass.section, klass.level, klass.room]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cx(
          'overflow-hidden rounded-lg border-[2.5px] border-ink shadow-pop-md',
          classBannerClass(klass.color),
        )}
      >
        <div className="px-6 pb-6 pt-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-extrabold leading-tight">
                {klass.name}
              </h2>
              {metaLine && (
                <p className="mt-1 text-[14px] text-white/80">{metaLine}</p>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-white/85">
                {isTeacher ? (
                  <>
                    <Users size={15} /> {klass.memberCount ?? 0} сурагч
                  </>
                ) : (
                  `Багш: ${klass.teacherName}`
                )}
              </p>
            </div>
            {isTeacher && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <Pencil size={15} /> Тохируулах
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <Card className="rounded-lg">
          <p className="text-[13px] font-semibold text-ink-soft">
            Ангийн код
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xl font-bold tracking-wide text-ink">
              {klass.code}
            </p>
            <CopyCodeButton code={klass.code} />
          </div>
        </Card>
        <Upcoming assignments={assignments} isTeacher={isTeacher} />
      </div>
    </div>
  );
}
