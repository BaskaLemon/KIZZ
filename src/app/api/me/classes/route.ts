import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  classCoTeachers,
  classMembers,
  classes,
  users,
} from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toClass } from '@/lib/mappers';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const db = getDb();

  const owned = await db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, auth.user.id));

  // Classes this teacher joined as a co-teacher, not the primary one.
  const coTaughtRows = await db
    .select({ klass: classes, teacherName: users.name })
    .from(classCoTeachers)
    .innerJoin(classes, eq(classCoTeachers.classId, classes.id))
    .innerJoin(users, eq(classes.teacherId, users.id))
    .where(eq(classCoTeachers.teacherId, auth.user.id));

  const ownedResults = owned.map((row) =>
    toClass(row, auth.user.name),
  );
  const coTaughtResults = coTaughtRows.map(({ klass, teacherName }) =>
    toClass(klass, teacherName),
  );

  const joined = await db
    .select({ klass: classes, teacherName: users.name })
    .from(classMembers)
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .innerJoin(users, eq(classes.teacherId, users.id))
    .where(eq(classMembers.studentId, auth.user.id));
  const joinedResults = joined.map(({ klass, teacherName }) =>
    toClass(klass, teacherName),
  );

  return NextResponse.json([
    ...ownedResults,
    ...coTaughtResults,
    ...joinedResults,
  ]);
}
