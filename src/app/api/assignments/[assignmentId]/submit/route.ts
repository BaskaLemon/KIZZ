import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, quizzes, submissions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { UNIQUE_VIOLATION, pgErrorCode } from '@/lib/dbErrors';
import type { SubmitResult } from '@/lib/types';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { assignmentId } = await params;
  if (!isUuid(assignmentId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
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

  const { isMember, isTeacher } = await getClassMembership(
    assignment.classId,
    auth.user.id,
  );
  if (!isMember) {
    return NextResponse.json(
      { error: 'Даалгавар олдсонгүй.' },
      { status: 404 },
    );
  }

  if (isTeacher) {
    return NextResponse.json(
      { error: 'Бүлгийн админ даалгавар илгээх боломжгүй.' },
      { status: 403 },
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
    if (pgErrorCode(err) === UNIQUE_VIOLATION) {
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
