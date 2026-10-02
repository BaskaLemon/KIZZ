import { CircleCheck, CircleX } from 'lucide-react';
import { cx } from '@/lib/cx';
import type { Question } from '@/lib/types';

/** Question-by-question look at a submitted quiz. With `reveal` the correct
 * answers and explanations are shown too; without it only whether each
 * answer was right, so a member can still retry the ones they missed. */
export function QuizReview({
  questions,
  answers,
  reveal,
}: {
  questions: Question[];
  answers: (number | null)[];
  reveal: boolean;
}) {
  return (
    <ol className="flex flex-col gap-2.5">
      {questions.map((q, qi) => {
        const picked = answers[qi] ?? null;
        const correct = picked === q.correctIndex;
        return (
          <li
            key={q.id}
            className={cx(
              'rounded-xl border p-3',
              correct ? 'border-mint/50 bg-mint/5' : 'border-coral/40 bg-coral/5',
            )}
          >
            <p className="flex items-start gap-2 font-semibold text-ink">
              {correct ? (
                <CircleCheck size={18} className="mt-0.5 shrink-0 text-mint" aria-label="Зөв" />
              ) : (
                <CircleX size={18} className="mt-0.5 shrink-0 text-coral" aria-label="Буруу" />
              )}
              <span>
                {qi + 1}. {q.prompt}
              </span>
            </p>
            <ul className="mt-2 flex flex-col gap-1 pl-6.5 text-[14px]">
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi;
                const isAnswer = reveal && oi === q.correctIndex;
                if (!isPicked && !isAnswer) {
                  return (
                    <li key={oi} className="text-ink-soft">
                      {opt}
                    </li>
                  );
                }
                return (
                  <li
                    key={oi}
                    className={cx(
                      'font-semibold',
                      isPicked && !correct ? 'text-coral' : 'text-mint',
                    )}
                  >
                    {opt}
                    <span className="ml-1.5 text-[12px] font-normal text-ink-soft">
                      {isPicked ? '(сонгосон)' : '(зөв хариулт)'}
                    </span>
                  </li>
                );
              })}
              {picked === null && (
                <li className="text-[13px] italic text-coral">Хариулаагүй</li>
              )}
            </ul>
            {reveal && q.explanation && (
              <p className="mt-2 pl-6.5 text-[13px] text-ink-soft">{q.explanation}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
