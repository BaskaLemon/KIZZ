import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, submissions, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toSubmission } from '@/lib/mappers';

type Params = { params: Promise<{ submissionId: string }> };

// Manual grading — the only way a quiz-less assignment's submission ever
// gets a score, since there's nothing to auto-grade. Also usable to correct
// an auto-computed quiz score if a teacher wants to override it.
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { submissionId } = await params;

  const db = getDb();
  const [row] = await db
    .select({ submission: submissions, classId: assignments.classId })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: 'Илгээлт олдсонгүй.' }, { status: 404 });
  }

  const { isTeacher } = await getClassMembership(row.classId, auth.user.id);
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн ангийн багш дүн оруулах боломжтой.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const score = body?.score;
  if (
    typeof score !== 'number' ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100
  ) {
    return NextResponse.json(
      { error: 'Дүн 0-100 хооронд бүхэл тоо байх ёстой.' },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(submissions)
    .set({ score })
    .where(eq(submissions.id, submissionId))
    .returning();

  const [student] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, updated.studentId))
    .limit(1);

  return NextResponse.json(toSubmission(updated, student?.name ?? ''));
}
