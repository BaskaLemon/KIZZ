'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Plus, X } from 'lucide-react';
import { Button, Card, EmptyState, Field, TextInput } from '@/components/ui';
import { AttachmentLink } from '@/components/AttachmentLink';
import { useAppState } from '@/lib/appState';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { dueInfo } from '@/lib/dueDate';
import { cx } from '@/lib/cx';
import { AssignmentTaker } from './AssignmentTaker';
import type { ApiError, Assignment, Quiz } from '@/lib/types';

const NO_QUIZ = '';

export function ClassAssignments({
  classId,
  isTeacher,
  assignments,
  onCreated,
}: {
  classId: string;
  isTeacher: boolean;
  assignments: Assignment[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [group] = useAppState('group');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizId, setQuizId] = useState(NO_QUIZ);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openStudentAssignment, setOpenStudentAssignment] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isTeacher && group) {
      api
        .listQuizzes(group.id)
        .then(setQuizzes)
        .catch(() => setQuizzes([]));
    }
  }, [isTeacher, group]);

  async function createAssignment() {
    if (!title.trim()) {
      toast('Даалгаврын нэрээ оруулна уу', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.createAssignment(classId, {
        title: title.trim(),
        dueAt: dueAt || null,
        quizId: quizId || undefined,
        file,
      });
      toast('Даалгавар нэмэгдлээ');
      setTitle('');
      setDueAt('');
      setQuizId(NO_QUIZ);
      setFile(null);
      setFormOpen(false);
      onCreated();
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Алдаа гарлаа', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {isTeacher && (
        <Button
          variant={formOpen ? 'ghost' : 'primary'}
          onClick={() => setFormOpen((v) => !v)}
          className="mb-5"
        >
          {formOpen ? (
            <>
              <X size={16} /> Хаах
            </>
          ) : (
            <>
              <Plus size={16} /> Даалгавар нэмэх
            </>
          )}
        </Button>
      )}

      {formOpen && (
        <Card className="mb-5 flex flex-col gap-3 rounded-lg">
          <Field label="Даалгаврын нэр*" className="mb-0">
            <TextInput
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ж: 3-р бүлгийн дасгал"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <Field label="Хугацаа (заавал биш)" className="mb-0">
              <input
                type="date"
                className="w-full rounded-sm border-2 border-line p-2.5"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </Field>
            <Field label="Quiz (заавал биш)" className="mb-0">
              <select
                className="w-full rounded-sm border-2 border-line p-2.5"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
              >
                <option value={NO_QUIZ}>Quiz сонгохгүй</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Хавсралт файл (заавал биш)" className="mb-0">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-[14px]"
            />
          </Field>
          <Button
            variant="primary"
            onClick={createAssignment}
            disabled={creating}
            className="self-start"
          >
            {creating ? 'Нэмж байна...' : 'Өгөх'}
          </Button>
        </Card>
      )}

      <h3 className="mb-2.5 mt-6 text-lg">Даалгаврууд</h3>
      {assignments.length === 0 ? (
        <EmptyState title="Даалгавар алга">
          <p>
            {isTeacher
              ? 'Дээрх товчоор анхны даалгавраа өгөөрэй.'
              : 'Багш даалгавар өгмөгц энд харагдана.'}
          </p>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a) => {
            const due = dueInfo(a.dueAt);
            return isTeacher ? (
              <Card key={a.id} className="rounded-lg">
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-answer-1/15 text-answer-1">
                    <ClipboardList size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base">{a.title}</h3>
                    <p
                      className={cx(
                        'text-[13px]',
                        due.overdue ? 'text-coral' : 'text-ink-soft',
                      )}
                    >
                      {due.label}
                      {!a.quizId && ' · Quiz-гүй'}
                    </p>
                  </div>
                  {a.materialId && (
                    <AttachmentLink
                      materialId={a.materialId}
                      className="shrink-0 rounded-full border-2 border-line px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    />
                  )}
                  <span className="shrink-0 rounded-full bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink-soft">
                    {a.submissionCount ?? 0} илгээсэн
                  </span>
                </div>
              </Card>
            ) : (
              <Card key={a.id} className="rounded-lg">
                <div className="flex flex-wrap items-center gap-3.5">
                  <div
                    className={cx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      a.mySubmission
                        ? 'bg-mint/15 text-mint'
                        : due.overdue
                          ? 'bg-coral/15 text-coral'
                          : 'bg-answer-1/15 text-answer-1',
                    )}
                  >
                    <ClipboardList size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base">{a.title}</h3>
                    <p
                      className={cx(
                        'text-[13px]',
                        due.overdue && !a.mySubmission
                          ? 'text-coral'
                          : 'text-ink-soft',
                      )}
                    >
                      {due.label}
                    </p>
                  </div>
                  {a.materialId && (
                    <AttachmentLink
                      materialId={a.materialId}
                      className="shrink-0 rounded-full border-2 border-line px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    />
                  )}
                  <Button
                    variant={a.mySubmission ? 'mint' : 'primary'}
                    onClick={() =>
                      setOpenStudentAssignment(
                        openStudentAssignment === a.id ? null : a.id,
                      )
                    }
                  >
                    {a.mySubmission ? (
                      <>
                        <CheckCircle2 size={15} />{' '}
                        {a.mySubmission.score === null
                          ? 'Илгээсэн'
                          : `${a.mySubmission.score}%`}
                      </>
                    ) : (
                      'Нээх →'
                    )}
                  </Button>
                </div>
                {openStudentAssignment === a.id && (
                  <div className="mt-4">
                    <AssignmentTaker assignmentId={a.id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
