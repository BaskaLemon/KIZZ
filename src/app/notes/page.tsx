'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Shell, View } from '@/components/Shell';
import { EmptyState, LinkButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { classBannerClass } from '@/lib/classColor';
import { cx } from '@/lib/cx';
import type { ApiError, Class } from '@/lib/types';

export default function NotesPage() {
  const { user, ready } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState<Class[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .myClasses()
      .then(setClasses)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Ангиудыг ачаалж чадсангүй', 'error');
        setClasses([]);
      });
  }, [user, toast]);

  if (!ready) return null;

  if (!user) {
    return (
      <Shell activePath="/notes">
        <View narrow>
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>
              Хамтын тэмдэглэл хөтлөхийн тулд эхлээд нэвтэрч, ангид элсэх
              шаардлагатай.
            </p>
            <LinkButton href="/login" variant="primary" className="mt-4">
              Нэвтрэх / Бүртгүүлэх →
            </LinkButton>
          </EmptyState>
        </View>
      </Shell>
    );
  }

  return (
    <Shell activePath="/notes">
      <View>
        <h2 className="mb-1 text-2xl">Хамтын тэмдэглэл</h2>
        <p className="mb-5 text-ink-soft">
          Ангийн хүмүүстэйгээ хамт тэмдэглэл хөтлөхийн тулд ангиа сонгоно уу.
        </p>

        {classes === null ? null : classes.length === 0 ? (
          <EmptyState title="Анги алга">
            <p>
              Тэмдэглэл хөтлөхийн тулд эхлээд ангид нэгдэх эсвэл анги үүсгэх
              шаардлагатай.
            </p>
            <LinkButton href="/classroom" variant="primary" className="mt-4">
              Ангийн танхим руу →
            </LinkButton>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/classroom?classId=${c.id}&tab=notes`}
                className={cx(
                  'flex items-center justify-between gap-2 rounded-md border-[2.5px] border-ink px-5 py-4 text-white no-underline shadow-pop-md transition-transform duration-75 hover:-translate-x-px hover:-translate-y-px',
                  classBannerClass(c.color),
                )}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-[17px] font-bold">{c.name}</h3>
                  <p className="truncate text-[13px] text-white/85">
                    {user.role === 'student'
                      ? `Багш: ${c.teacherName}`
                      : 'Таны анги'}
                  </p>
                </div>
                <GraduationCap
                  size={22}
                  className="shrink-0 text-white/70"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        )}
      </View>
    </Shell>
  );
}
