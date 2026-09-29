'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { initials } from '@/lib/initials';
import type { ApiError, ClassPeople } from '@/lib/types';

function PersonRow({ name, badge }: { name: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 border-b-2 border-line py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet/15 text-sm font-bold text-violet">
        {initials(name)}
      </span>
      <p className="text-[15px] font-medium text-ink">{name}</p>
      {badge && (
        <span className="ml-auto rounded-full bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink-soft">
          {badge}
        </span>
      )}
    </div>
  );
}

export function People({ classId }: { classId: string }) {
  const toast = useToast();
  const [people, setPeople] = useState<ClassPeople | null>(null);

  useEffect(() => {
    api
      .getPeople(classId)
      .then(setPeople)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Гишүүдийг ачаалж чадсангүй', 'error');
      });
  }, [classId]);

  if (!people) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2.5 text-lg">Багш нар</h3>
        <div className="rounded-md border-[2.5px] border-ink bg-paper-raised px-5 py-1 shadow-pop-md">
          {people.teachers.map((t) => (
            <PersonRow
              key={t.id}
              name={t.name}
              badge={t.isPrimary ? undefined : 'Хамтран багш'}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-lg">Сурагчид</h3>
        {people.students.length === 0 ? (
          <p className="text-ink-soft">Одоогоор сурагч алга.</p>
        ) : (
          <div className="rounded-md border-[2.5px] border-ink bg-paper-raised px-5 py-1 shadow-pop-md">
            {people.students.map((s) => (
              <PersonRow key={s.id} name={s.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
