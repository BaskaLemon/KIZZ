import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, submissions, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toSubmission } from '@/lib/mappers';

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

  const { isTeacher } = await getClassMembership(
    assignment.classId,
    auth.user.id,
  );
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн ангийн багш дүнгийн самбарыг харах боломжтой.' },
      { status: 403 },
    );
  }

  const rows = await db
    .select({ submission: submissions, studentName: users.name })
    .from(submissions)
    .innerJoin(users, eq(submissions.studentId, users.id))
    .where(eq(submissions.assignmentId, assignmentId))
    .orderBy(desc(submissions.submittedAt));

  return NextResponse.json(
    rows.map(({ submission, studentName }) =>
      toSubmission(submission, studentName),
    ),
  );
}
