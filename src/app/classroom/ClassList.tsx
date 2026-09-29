'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Plus, X } from 'lucide-react';
import { View } from '@/components/Shell';
import { Button, Card, EmptyState, Field, TextInput } from '@/components/ui';
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
    user.role === 'student'
      ? `Багш: ${c.teacherName}`
      : c.teacherId === user.id
        ? 'Таны анги'
        : `Хамтран багш: ${c.teacherName}`;

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
  const [classes, setClasses] = useState<Class[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [level, setLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [classCode, setClassCode] = useState('');
  const [color, setColor] = useState<ClassColorKey>(randomClassColor);

  useEffect(() => {
    api
      .myClasses()
      .then(setClasses)
      .catch((err: ApiError) => {
        toast(err.payload?.error || 'Ангиудыг ачаалж чадсангүй', 'error');
        setClasses([]);
      });
  }, []);

  // Grouping into folders is a teacher-side organizational tool — students
  // just see their classes as a flat list.
  const grouped = useMemo(() => {
    if (!classes || user.role !== 'teacher') return null;
    const byGroup = new Map<string, { name: string; classes: Class[] }>();
    const ungrouped: Class[] = [];
    for (const c of classes) {
      if (c.groupId) {
        const bucket = byGroup.get(c.groupId) ?? {
          name: c.groupName ?? 'Хавтас',
          classes: [],
        };
        bucket.classes.push(c);
        byGroup.set(c.groupId, bucket);
      } else {
        ungrouped.push(c);
      }
    }
    return {
      folders: [...byGroup.entries()].map(([id, v]) => ({ id, ...v })),
      ungrouped,
    };
  }, [classes, user.role]);

  async function createClass() {
    if (!className.trim()) return toast('Ангийн нэрээ оруулна уу', 'error');
    try {
      const klass = await api.createClass({
        name: className.trim(),
        color,
        section: section.trim() || undefined,
        level: level.trim() || undefined,
        subject: subject.trim() || undefined,
        room: room.trim() || undefined,
      });
      toast(`Анги үүслээ — код: ${klass.code}`);
      router.push(`/classroom?classId=${klass.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
    }
  }

  async function joinClass() {
    if (!classCode.trim()) return toast('Ангийн кодоо оруулна уу', 'error');
    try {
      const klass = await api.joinClass(classCode.trim());
      toast(
        user.role === 'teacher'
          ? `"${klass.name}" ангид хамтран багшаар нэгдлээ`
          : `"${klass.name}" ангид нэгдлээ`,
      );
      router.push(`/classroom?classId=${klass.id}`);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Код буруу байна', 'error');
    }
  }

  return (
    <View>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="mb-0.5 text-2xl">Ангийн танхим</h2>
          <p className="text-ink-soft">
            {user.name} — {user.role === 'teacher' ? 'Багш' : 'Сурагч'}
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
              <Plus size={16} /> {user.role === 'teacher' ? 'Анги' : 'Нэгдэх'}
            </>
          )}
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-5 flex flex-col gap-3 rounded-lg">
          {user.role === 'teacher' && (
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

          {user.role === 'teacher' && mode === 'create' && (
            <>
              <h3 className="text-[17px]">Шинэ анги үүсгэх</h3>
              <Field label="Ангийн нэр*" className="mb-0">
                <TextInput
                  autoFocus
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createClass()}
                  placeholder="ж: 10А анги — Биологи"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                <Field label="Бүлэг (Section)" className="mb-0">
                  <TextInput
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  />
                </Field>
                <Field label="Түвшин (Level)" className="mb-0">
                  <TextInput
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  />
                </Field>
                <Field label="Хичээл (Subject)" className="mb-0">
                  <TextInput
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
                <Field label="Өрөө (Room)" className="mb-0">
                  <TextInput value={room} onChange={(e) => setRoom(e.target.value)} />
                </Field>
              </div>
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

          {(user.role === 'student' || mode === 'join') && (
            <>
              <h3 className="text-[17px]">
                {user.role === 'teacher' ? 'Кодоор ангид нэгдэх' : 'Ангид нэгдэх'}
              </h3>
              {user.role === 'teacher' && (
                <p className="text-[13px] text-ink-soft">
                  Өөр багшийн ангид хамтран багшаар нэгдэнэ.
                </p>
              )}
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

      {classes === null ? null : classes.length === 0 ? (
        <>
          <h3 className="mb-2.5 text-lg">Миний ангиуд</h3>
          <EmptyState title="Анги алга">
            <p>
              {user.role === 'teacher'
                ? 'Дээрх товчоор шинэ анги үүсгэх эсвэл кодоор нэгдээрэй.'
                : 'Дээрх товчоор багшийн өгсөн кодоор нэгдээрэй.'}
            </p>
          </EmptyState>
        </>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {grouped.folders.map((folder) => (
            <div key={folder.id}>
              <h3 className="mb-2.5 text-lg">{folder.name}</h3>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {folder.classes.map((c) => (
                  <ClassCard key={c.id} user={user} c={c} />
                ))}
              </div>
            </div>
          ))}
          {grouped.ungrouped.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-lg">
                {grouped.folders.length > 0 ? 'Бусад анги' : 'Миний ангиуд'}
              </h3>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {grouped.ungrouped.map((c) => (
                  <ClassCard key={c.id} user={user} c={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <h3 className="mb-2.5 text-lg">Миний ангиуд</h3>
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
