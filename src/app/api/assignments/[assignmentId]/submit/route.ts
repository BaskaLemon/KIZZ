import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, quizzes, submissions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { UNIQUE_VIOLATION, pgErrorCode } from '@/lib/dbErrors';
import { classTeacherIds, notifyUsers } from '@/lib/notifications';
import { awardAssignmentCompletion } from '@/lib/points/awards';
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

  let reward: SubmitResult['reward'] = undefined;

  const [existing] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, auth.user.id)),
    )
    .limit(1);

  if (existing) {
    // Redoing it is fine until the deadline; after that the result is final.
    if (assignment.dueAt && assignment.dueAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Хугацаа дууссан тул дахин илгээх боломжгүй.' },
        { status: 409 },
      );
    }
    await db
      .update(submissions)
      .set({ answers, score, submittedAt: new Date() })
      .where(eq(submissions.id, existing.id));
  } else {
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
  }

  // The first time a quiz is completed it earns XP (resubmitting doesn't).
  if (!existing && assignment.quizId && score !== null) {
    reward = (await awardAssignmentCompletion(auth.user.id, assignmentId, score)) ?? undefined;
  }

  // Without a quiz nothing is auto-graded, so tell the admins there is
  // something waiting for a grade.
  if (!assignment.quizId) {
    await notifyUsers(await classTeacherIds(assignment.classId), {
      title: `${auth.user.name} "${assignment.title}" даалгавар илгээлээ`,
      body: 'Дүн оруулахыг хүлээж байна',
      href: `/classroom?classId=${assignment.classId}&tab=marks`,
    });
  }

  const result: SubmitResult = { score, correctCount, totalQuestions, reward };
  return NextResponse.json(result, { status: existing ? 200 : 201 });
}
