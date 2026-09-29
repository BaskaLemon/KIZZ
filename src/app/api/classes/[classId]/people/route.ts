import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classCoTeachers, classMembers, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import type { ClassPeople } from '@/lib/types';

type Params = { params: Promise<{ classId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

  const db = getDb();
  const [primaryTeacher] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, klass.teacherId))
    .limit(1);

  const coTeachers = await db
    .select({ id: users.id, name: users.name })
    .from(classCoTeachers)
    .innerJoin(users, eq(classCoTeachers.teacherId, users.id))
    .where(eq(classCoTeachers.classId, classId))
    .orderBy(asc(users.name));

  const students = await db
    .select({ id: users.id, name: users.name })
    .from(classMembers)
    .innerJoin(users, eq(classMembers.studentId, users.id))
    .where(eq(classMembers.classId, classId))
    .orderBy(asc(users.name));

  const people: ClassPeople = {
    teachers: [
      { ...(primaryTeacher ?? { id: klass.teacherId, name: '' }), isPrimary: true },
      ...coTeachers.map((t) => ({ ...t, isPrimary: false })),
    ],
    students,
  };
  return NextResponse.json(people);
}
