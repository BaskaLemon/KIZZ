import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, quizzes, submissions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import type { SubmitResult } from '@/lib/types';

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { assignmentId } = await params;

  if (auth.user.role !== 'student') {
    return NextResponse.json(
      { error: 'Зөвхөн сурагч даалгавар илгээх боломжтой.' },
      { status: 403 },
    );
  }

  const db = getDb();
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment) {
    return NextResponse.json(
      { error: 'Даалгавар олдсонгүй.' },
      { status: 404 },
    );
  }

  const { isMember } = await getClassMembership(
    assignment.classId,
    auth.user.id,
  );
  if (!isMember) {
    return NextResponse.json(
      { error: 'Даалгавар олдсонгүй.' },
      { status: 404 },
    );
  }

  // A quiz-less assignment has nothing to auto-score — "submitting" just
  // marks it turned in, with a null score until the teacher grades it
  // manually (see PATCH /submissions/:id).
  let answers: (number | null)[] = [];
  let correctCount: number | null = null;
  let totalQuestions = 0;
  let score: number | null = null;

  if (assignment.quizId) {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, assignment.quizId))
      .limit(1);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const rawAnswers = Array.isArray(body?.answers) ? body.answers : [];
    answers = quiz.questions.map((_, i) =>
      typeof rawAnswers[i] === 'number' ? rawAnswers[i] : null,
    );
    correctCount = quiz.questions.filter(
      (q, i) => answers[i] === q.correctIndex,
    ).length;
    totalQuestions = quiz.questions.length;
    score =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  }

  try {
    await db.insert(submissions).values({
      assignmentId,
      studentId: auth.user.id,
      answers,
      score,
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Та энэ даалгаврыг өмнө нь илгээсэн байна.' },
        { status: 409 },
      );
    }
    throw err;
  }

  const result: SubmitResult = { score, correctCount, totalQuestions };
  return NextResponse.json(result, { status: 201 });
}
