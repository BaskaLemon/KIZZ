import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, quizzes, submissions } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toAssignment, toQuiz, toSubmission } from '@/lib/mappers';
import type { AssignmentDetail } from '@/lib/types';

type Params = { params: Promise<{ assignmentId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { assignmentId } = await params;

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

  const { klass, isMember, isTeacher } = await getClassMembership(
    assignment.classId,
    auth.user.id,
  );
  if (!klass || !isMember) {
    return NextResponse.json(
      { error: 'Даалгавар олдсонгүй.' },
      { status: 404 },
    );
  }

  let quiz = null;
  if (assignment.quizId) {
    [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, assignment.quizId))
      .limit(1);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
    }
  }

  let mySubmission: AssignmentDetail['mySubmission'] = null;
  if (!isTeacher) {
    const [row] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, auth.user.id),
        ),
      )
      .limit(1);
    if (row) mySubmission = toSubmission(row, auth.user.name);
  }

  const detail: AssignmentDetail = {
    ...toAssignment(assignment),
    quiz: quiz ? toQuiz(quiz) : null,
    mySubmission,
  };
  return NextResponse.json(detail);
}
