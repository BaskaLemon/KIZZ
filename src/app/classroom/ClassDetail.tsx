'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { View } from '@/components/Shell';
import { Tabs } from '@/components/Tabs';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassStream } from './ClassStream';
import { ClassAssignments } from './ClassAssignments';
import { ClassNotes } from './ClassNotes';
import { ClassQuiz } from './ClassQuiz';
import { ClassMarks } from './ClassMarks';
import { People } from './People';
import { EditClassDialog } from './EditClassDialog';
import type { ApiError, Assignment, Class, User } from '@/lib/types';

export type TabKey =
  | 'stream'
  | 'classwork'
  | 'notes'
  | 'quiz'
  | 'people'
  | 'marks';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stream', label: 'Ерөнхий' },
  { key: 'classwork', label: 'Даалгавар' },
  { key: 'notes', label: 'Тэмдэглэл' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'people', label: 'Хүмүүс' },
  { key: 'marks', label: 'Дүн' },
];

export default function ClassDetail({
  user,
  classId,
  initialTab,
}: {
  user: User;
  classId: string;
  initialTab?: TabKey;
}) {
  const toast = useToast();
  const router = useRouter();
  const [klass, setKlass] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? 'stream');

  const isTeacher = user.role === 'teacher';

  async function reloadAssignments() {
    setAssignments(await api.listAssignments(classId));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getClass(classId), api.listAssignments(classId)])
      .then(([k, a]) => {
        if (cancelled) return;
        setKlass(k);
        setAssignments(a);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        toast(err.payload?.error || 'Анги олдсонгүй', 'error');
        router.push('/classroom');
      });
    return () => {
      cancelled = true;
    };
  }, [classId, router, toast]);

  if (!klass || !assignments) return null;

  return (
    <View>
      <Link
        href="/classroom"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={15} /> Бүх анги
      </Link>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'stream' && (
          <ClassStream
            klass={klass}
            assignments={assignments}
            isTeacher={isTeacher}
            onEdit={() => setEditOpen(true)}
          />
        )}

        {activeTab === 'classwork' && (
          <ClassAssignments
            classId={classId}
            isTeacher={isTeacher}
            assignments={assignments}
            onCreated={reloadAssignments}
          />
        )}

        {activeTab === 'notes' && (
          <ClassNotes classId={classId} currentUser={user} />
        )}

        {activeTab === 'quiz' && <ClassQuiz classId={classId} />}

        {activeTab === 'people' && <People classId={classId} />}

        {activeTab === 'marks' && (
          <ClassMarks assignments={assignments} isTeacher={isTeacher} />
        )}
      </div>

      {isTeacher && (
        <EditClassDialog
          open={editOpen}
          klass={klass}
          onClose={() => setEditOpen(false)}
          onSaved={setKlass}
        />
      )}
    </View>
  );
}
