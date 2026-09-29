'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { AttachmentLink } from '@/components/AttachmentLink';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ApiError, AssignmentDetail, SubmitResult } from '@/lib/types';

export function AssignmentTaker({ assignmentId }: { assignmentId: string }) {
  const toast = useToast();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    api.getAssignment(assignmentId).then((a) => {
      setAssignment(a);
      setAnswers(new Array(a.quiz?.questions.length ?? 0).fill(null));
    });
  }, [assignmentId]);

  if (!assignment) return null;

  if (assignment.mySubmission) {
    return (
      <>
        <p className="font-bold text-violet">
          {assignment.mySubmission.score === null
            ? 'Та энэ даалгаврыг илгээсэн байна. Багш дүн оруулах хүлээгдэж байна.'
            : `Та энэ даалгаврыг ${assignment.mySubmission.score}% дүнтэй дуусгасан байна.`}
        </p>
        <p className="text-[13px] text-ink-soft">
          Илгээсэн:{' '}
          {new Date(assignment.mySubmission.submittedAt).toLocaleString()}
        </p>
        {assignment.materialId && (
          <div className="mt-2">
            <AttachmentLink materialId={assignment.materialId} />
          </div>
        )}
      </>
    );
  }

  async function submit() {
    try {
      const r = await api.submitAssignment(assignmentId, { answers });
      setResult(r);
    } catch (err) {
      toast(
        (err as ApiError).payload?.error || 'Илгээхэд алдаа гарлаа',
        'error',
      );
    }
  }

  if (!assignment.quiz) {
    // No quiz attached — a plain instructional item. Nothing to answer,
    // just an optional attachment and a "mark as done" action.
    return (
      <div className="flex flex-col gap-3">
        {assignment.materialId && <AttachmentLink materialId={assignment.materialId} />}
        <Button variant="primary" onClick={submit} className="self-start">
          Дуусгасан гэж тэмдэглэх
        </Button>
        {result && (
          <p className="mt-1 font-bold text-violet">
            Илгээгдлээ. Багш дүн оруулах хүлээгдэж байна.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assignment.materialId && <AttachmentLink materialId={assignment.materialId} />}
      {assignment.quiz.questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-line p-3">
          <p className="mb-2 font-semibold">
            {qi + 1}. {q.prompt}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  type="radio"
                  name={`q${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers((prev) =>
                      prev.map((v, i) => (i === qi ? oi : v)),
                    )
                  }
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-soft">
          {answers.filter((a) => a !== null).length} / {answers.length}{' '}
          асуулт бөглөсөн
        </p>
        <Button variant="primary" onClick={submit}>
          Илгээх
        </Button>
      </div>
      {result && (
        <p className="mt-3 font-bold text-violet">
          Дүн: {result.score}% ({result.correctCount}/{result.totalQuestions}{' '}
          зөв)
        </p>
      )}
    </div>
  );
}
