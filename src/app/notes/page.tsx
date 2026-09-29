'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Shell, View } from '@/components/Shell';
import { EmptyState, LinkButton } from '@/components/ui';
import { ClassNotes } from '@/app/classroom/ClassNotes';
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
        toast(err.payload?.error || 'Бүлгүүдийг ачаалж чадсангүй', 'error');
        setClasses([]);
      });
  }, [user, toast]);

  if (!ready)
    return (
      <Shell activePath="/notes">
        <LoadingScreen />
      </Shell>
    );

  if (!user) {
    return (
      <Shell activePath="/notes">
        <View narrow>
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>
              Тэмдэглэлээ хадгалахын тулд нэвтэрнэ үү.
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
        <h2 className="mb-1 text-2xl">Тэмдэглэл</h2>
        <p className="mb-5 text-ink-soft">
          Өөрийн хувийн тэмдэглэлээ хөтөлж, тэндээс quiz үүсгээрэй.
        </p>

        <ClassNotes currentUser={user} />

        {classes !== null && classes.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-1 text-lg">Бүлгийн тэмдэглэл</h3>
            <p className="mb-3 text-[13px] text-ink-soft">
              Бүлгийнхээ хүмүүстэй хамт хөтлөх тэмдэглэл.
            </p>
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
                      {c.teacherId === user.id
                        ? 'Таны бүлэг'
                        : `Үүсгэсэн: ${c.teacherName}`}
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
          </div>
        )}
      </View>
    </Shell>
  );
}
