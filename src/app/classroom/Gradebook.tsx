'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ApiError, Submission } from '@/lib/types';

function scoreClass(score: number) {
  if (score >= 80) return 'bg-mint';
  if (score >= 50) return 'bg-amber';
  return 'bg-coral text-white';
}

function GradeEntry({
  submission,
  onGraded,
}: {
  submission: Submission;
  onGraded: (updated: Submission) => void;
}) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const score = Number(value);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      toast('Дүн 0-100 хооронд бүхэл тоо байх ёстой', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.gradeSubmission(submission.id, score);
      onGraded(updated);
    } catch (err) {
      toast((err as ApiError).payload?.error || 'Дүн хадгалахад алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0-100"
        className="w-20 rounded-sm border-2 border-line px-2 py-1 text-[13px]"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving || value === ''}
        className="rounded-full bg-violet px-3 py-1 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        Хадгалах
      </button>
    </div>
  );
}

export function Gradebook({ assignmentId }: { assignmentId: string }) {
  const toast = useToast();
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  useEffect(() => {
    api
      .listSubmissions(assignmentId)
      .then(setSubmissions)
      .catch((err: ApiError) => {
        toast(
          err.payload?.error || 'Дүнгийн самбарыг ачаалж чадсангүй',
          'error',
        );
      });
  }, [assignmentId]);

  if (submissions === null) return null;

  if (submissions.length === 0) {
    return (
      <p className="mt-3.5 text-ink-soft">Хараахан хэн ч дуусгаагүй байна.</p>
    );
  }

  const graded = submissions.filter(
    (s): s is Submission & { score: number } => s.score !== null,
  );
  const average =
    graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + s.score, 0) / graded.length)
      : null;

  function handleGraded(updated: Submission) {
    setSubmissions((prev) =>
      prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
    );
  }

  return (
    <>
      <p className="mt-3.5 text-[13px] font-semibold text-ink-soft">
        {submissions.length} сурагч илгээсэн
        {average !== null && ` · Дундаж оноо: ${average}%`}
        {graded.length < submissions.length &&
          ` · ${submissions.length - graded.length} дүн ороогүй`}
      </p>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b-2 border-line px-3 py-2.5 text-left text-[13px] text-ink-soft">
              Сурагч
            </th>
            <th className="border-b-2 border-line px-3 py-2.5 text-left text-[13px] text-ink-soft">
              Дүн
            </th>
            <th className="border-b-2 border-line px-3 py-2.5 text-left text-[13px] text-ink-soft">
              Илгээсэн
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td className="border-b-2 border-line px-3 py-2.5">
                {s.studentName}
              </td>
              <td className="border-b-2 border-line px-3 py-2.5">
                {s.score === null ? (
                  <GradeEntry submission={s} onGraded={handleGraded} />
                ) : (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.75 text-[13px] font-bold ${scoreClass(s.score)}`}
                  >
                    {s.score}%
                  </span>
                )}
              </td>
              <td className="border-b-2 border-line px-3 py-2.5">
                {new Date(s.submittedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
