'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Plus, X } from 'lucide-react';
import { View } from '@/components/Shell';
import { Button, Card, EmptyState, Field, SkeletonList, TextInput } from '@/components/ui';
import { CopyCodeButton } from '@/components/CopyCodeButton';
import { ColorPicker } from '@/components/ColorPicker';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { classBannerClass, randomClassColor } from '@/lib/classColor';
import type { ClassColorKey } from '@/lib/classColor';
import { cx } from '@/lib/cx';
import type { ApiError, Class, User } from '@/lib/types';

function ClassCard({ user, c }: { user: User; c: Class }) {
  const subtitle =
    c.teacherId === user.id ? 'Таны бүлэг' : `Үүсгэсэн: ${c.teacherName}`;

  return (
    <Link
      href={`/classroom?classId=${c.id}`}
      className="group flex flex-col overflow-hidden rounded-md border-[2.5px] border-ink bg-paper-raised text-inherit no-underline shadow-pop-md transition-transform duration-75 hover:-translate-x-px hover:-translate-y-px"
    >
      <div
        className={cx(
          'flex items-start justify-between gap-2 px-5 py-4 text-white',
          classBannerClass(c.color),
        )}
      >
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-bold">{c.name}</h3>
          <p className="truncate text-[13px] text-white/85">{subtitle}</p>
        </div>
        <GraduationCap size={22} className="shrink-0 text-white/70" aria-hidden />
      </div>
      <div className="flex items-center justify-between px-5 py-3.5">
        <CopyCodeButton code={c.code} />
        <span className="text-[13px] font-semibold text-violet opacity-0 transition-opacity group-hover:opacity-100">
          Нээх →
        </span>
      </div>
    </Link>
  );
}

export default function ClassList({ user }: { user: User }) {
  const toast = useToast();
  const router = useRouter();
  const [allClasses, setClasses] = useState<Class[] | null>(null);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [color, setColor] = useState<ClassColorKey>(randomClassColor);

  useEffect(() => {
    api
      .myClasses()
      .then(setClasses)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Бүлгүүдийг ачаалж чадсангүй', 'error');
        setClasses([]);
      });
  }, [toast]);

  const classes = useMemo(
    () =>
      allClasses && query.trim()
        ? allClasses.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
        : allClasses,
    [allClasses, query],
  );

  async function createClass() {
    if (!className.trim()) return toast('Бүлгийн нэрээ оруулна уу', 'error');
    try {
      const klass = await api.createClass({
        name: className.trim(),
        color,
      });
      toast(`Бүлэг үүслээ — код: ${klass.code}`);
      router.push(`/classroom?classId=${klass.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
    }
  }

  async function joinClass() {
    if (!classCode.trim()) return toast('Бүлгийн кодоо оруулна уу', 'error');
    try {
      const klass = await api.joinClass(classCode.trim());
      toast(`"${klass.name}" бүлэгт нэгдлээ`);
      router.push(`/classroom?classId=${klass.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Код буруу байна', 'error');
    }
  }

  return (
    <View>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="mb-0.5 text-2xl">Бүлгүүд</h2>
          <p className="text-ink-soft">
            Найз, баг, гэр бүл эсвэл ангийнхаа хүмүүстэй хамт суралцаарай.
          </p>
        </div>
        <Button
          variant={formOpen ? 'ghost' : 'primary'}
          onClick={() => setFormOpen((v) => !v)}
        >
          {formOpen ? (
            <>
              <X size={16} /> Хаах
            </>
          ) : (
            <>
              <Plus size={16} /> Бүлэг
            </>
          )}
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-5 flex flex-col gap-3 rounded-lg">
          {(
            <div className="mb-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={cx(
                  'rounded-full border-2 px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  mode === 'create'
                    ? 'border-ink bg-ink text-white'
                    : 'border-line text-ink hover:border-ink/30',
                )}
              >
                Шинээр үүсгэх
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={cx(
                  'rounded-full border-2 px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  mode === 'join'
                    ? 'border-ink bg-ink text-white'
                    : 'border-line text-ink hover:border-ink/30',
                )}
              >
                Кодоор нэгдэх
              </button>
            </div>
          )}

          {mode === 'create' && (
            <>
              <h3 className="text-[17px]">Шинэ бүлэг үүсгэх</h3>
              <Field label="Бүлгийн нэр*" className="mb-0">
                <TextInput
                  autoFocus
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createClass()}
                  placeholder="ж: Англи хэлний бүлэг"
                />
              </Field>
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">
                  Өнгө сонгох
                </p>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <Button variant="primary" onClick={createClass} className="self-start">
                Үүсгэх
              </Button>
            </>
          )}

          {mode === 'join' && (
            <>
              <h3 className="text-[17px]">Кодоор бүлэгт нэгдэх</h3>
              <div className="flex flex-wrap gap-3">
                <TextInput
                  className="flex-1"
                  autoFocus
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinClass()}
                  placeholder="ж: 7K3QF"
                />
                <Button variant="mint" onClick={joinClass}>
                  Нэгдэх
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {allClasses !== null && allClasses.length > 4 && (
        <TextInput
          className="mb-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Бүлэг хайх..."
          aria-label="Бүлэг хайх"
        />
      )}
      {classes === null ? (
        <SkeletonList />
      ) : classes.length === 0 ? (
        <>
          <h3 className="mb-2.5 text-lg">Миний бүлгүүд</h3>
          <EmptyState title="Бүлэг алга">
            <p>
              Дээрх товчоор шинэ бүлэг үүсгэх эсвэл найзынхаа өгсөн кодоор
              нэгдээрэй.
            </p>
          </EmptyState>
        </>
      ) : (
        <>
          <h3 className="mb-2.5 text-lg">Миний бүлгүүд</h3>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {classes.map((c) => (
              <ClassCard key={c.id} user={user} c={c} />
            ))}
          </div>
        </>
      )}
    </View>
  );
}
