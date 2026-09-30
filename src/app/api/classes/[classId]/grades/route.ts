import { NextResponse } from 'next/server';
import { asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, classMembers, submissions, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import type { GradeCell } from '@/lib/types';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ classId: string }> };


/** Admin only: every member × every assignment in one table. */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;
  if (!isUuid(classId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const { klass, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass) return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн бүлгийн админ нэгдсэн дүнг харах боломжтой.' },
      { status: 403 },
    );
  }

  const db = getDb();
  const classAssignments = await db
    .select({ id: assignments.id, title: assignments.title, dueAt: assignments.dueAt })
    .from(assignments)
    .where(eq(assignments.classId, classId))
    .orderBy(asc(assignments.createdAt));
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(classMembers)
    .innerJoin(users, eq(classMembers.studentId, users.id))
    .where(eq(classMembers.classId, classId))
    .orderBy(asc(users.name));

  const subs =
    classAssignments.length === 0
      ? []
      : await db
          .select()
          .from(submissions)
          .where(inArray(submissions.assignmentId, classAssignments.map((a) => a.id)));
  const dueById = new Map(classAssignments.map((a) => [a.id, a.dueAt]));

  const cells = new Map<string, GradeCell>();
  for (const s of subs) {
    const due = dueById.get(s.assignmentId);
    cells.set(`${s.studentId}:${s.assignmentId}`, {
      score: s.score,
      submittedAt: s.submittedAt.toISOString(),
      late: !!due && s.submittedAt > due,
    });
  }

  return NextResponse.json({
    assignments: classAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
    })),
    students: members.map((m) => {
      const row: Record<string, GradeCell | null> = {};
      for (const a of classAssignments) row[a.id] = cells.get(`${m.id}:${a.id}`) ?? null;
      const graded = Object.values(row).filter(
        (c): c is GradeCell & { score: number } => !!c && c.score !== null,
      );
      return {
        id: m.id,
        name: m.name,
        cells: row,
        average: graded.length
          ? Math.round(graded.reduce((sum, c) => sum + c.score, 0) / graded.length)
          : null,
      };
    }),
  });
}
