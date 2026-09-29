'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui';
import type { Quiz } from '../lib/types';

export function QuizPlayer({
  quiz,
  onBack,
}: {
  quiz: Quiz;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);

  const correctCount = quiz.questions.filter(
    (q, qi) => answers[qi] === q.correctIndex,
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={15} /> Бүх quiz
      </button>

      <h3 className="text-lg">{quiz.title}</h3>

      <div className="flex flex-col gap-3">
        {quiz.questions.map((q, qi) => {
          const picked = answers[qi];
          return (
            <div key={q.id} className="rounded-xl border border-line p-3">
              <p className="mb-2 font-semibold">
                {qi + 1}. {q.prompt}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const isAnswerKey = submitted && oi === q.correctIndex;
                  const isWrongPick = submitted && isPicked && oi !== q.correctIndex;
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-lg px-2 py-1 ${
                        submitted ? 'cursor-default' : 'cursor-pointer'
                      } ${isAnswerKey ? 'bg-green-500/10' : ''} ${
                        isWrongPick ? 'bg-coral/10' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        disabled={submitted}
                        checked={isPicked}
                        onChange={() =>
                          setAnswers((prev) =>
                            prev.map((v, i) => (i === qi ? oi : v)),
                          )
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="mt-2 text-[13px] text-ink-soft">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-soft">
          {answers.filter((a) => a !== null).length} / {answers.length} асуулт
          бөглөсөн
        </p>
        {submitted ? (
          <p className="font-bold text-violet">
            Дүн: {correctCount}/{quiz.questions.length} зөв
          </p>
        ) : (
          <Button
            variant="primary"
            onClick={() => setSubmitted(true)}
            disabled={answers.some((a) => a === null)}
          >
            Шалгах
          </Button>
        )}
      </div>
    </div>
  );
}
