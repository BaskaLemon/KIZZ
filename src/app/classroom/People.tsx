'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { initials } from '@/lib/initials';
import type { ApiError, ClassPeople } from '@/lib/types';

function PersonRow({
  name,
  badge,
  actions,
}: {
  name: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
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
      {actions && (
        <div className={`flex gap-2 ${badge ? '' : 'ml-auto'}`}>{actions}</div>
      )}
    </div>
  );
}

const linkBtn =
  'rounded-full border-2 border-line px-3 py-1 text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink';

export function People({
  classId,
  canManage,
  isOwner,
}: {
  classId: string;
  canManage: boolean;
  isOwner: boolean;
}) {
  const toast = useToast();
  const [people, setPeople] = useState<ClassPeople | null>(null);

  useEffect(() => {
    api
      .getPeople(classId)
      .then(setPeople)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Гишүүдийг ачаалж чадсангүй', 'error');
      });
  }, [classId, toast]);

  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action();
      toast(done);
      setPeople(await api.getPeople(classId));
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
    }
  }

  function remove(id: string, name: string) {
    if (!window.confirm(`${name}-г бүлгээс хасах уу?`)) return;
    void run(() => api.removeMember(classId, id), 'Гишүүн хасагдлаа');
  }

  if (!people) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2.5 text-lg">Админууд</h3>
        <div className="rounded-md border-[2.5px] border-ink bg-paper-raised px-5 py-1 shadow-pop-md">
          {people.teachers.map((t) => (
            <PersonRow
              key={t.id}
              name={t.name}
              badge={t.isPrimary ? 'Үүсгэгч' : 'Хамтран админ'}
              actions={
                isOwner && !t.isPrimary ? (
                  <>
                    <button
                      type="button"
                      className={linkBtn}
                      onClick={() =>
                        run(
                          () => api.setMemberAdmin(classId, t.id, false),
                          'Админ эрх авагдлаа',
                        )
                      }
                    >
                      Админ эрх авах
                    </button>
                    <button
                      type="button"
                      className={linkBtn}
                      onClick={() => remove(t.id, t.name)}
                    >
                      Хасах
                    </button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-lg">Гишүүд</h3>
        {people.students.length === 0 ? (
          <p className="text-ink-soft">Одоогоор гишүүн алга.</p>
        ) : (
          <div className="rounded-md border-[2.5px] border-ink bg-paper-raised px-5 py-1 shadow-pop-md">
            {people.students.map((s) => (
              <PersonRow
                key={s.id}
                name={s.name}
                actions={
                  canManage ? (
                    <>
                      {isOwner && (
                        <button
                          type="button"
                          className={linkBtn}
                          onClick={() =>
                            run(
                              () => api.setMemberAdmin(classId, s.id, true),
                              `${s.name} админ боллоо`,
                            )
                          }
                        >
                          Админ болгох
                        </button>
                      )}
                      <button
                        type="button"
                        className={linkBtn}
                        onClick={() => remove(s.id, s.name)}
                      >
                        Хасах
                      </button>
                    </>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
