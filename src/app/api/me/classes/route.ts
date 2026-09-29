import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  classCoTeachers,
  classGroups,
  classMembers,
  classes,
  users,
  type ClassRow,
} from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toClass } from '@/lib/mappers';

async function resolveGroupNames(rows: ClassRow[]): Promise<Map<string, string>> {
  const ids = [
    ...new Set(rows.map((r) => r.groupId).filter((id): id is string => !!id)),
  ];
  if (ids.length === 0) return new Map();
  const groups = await getDb()
    .select()
    .from(classGroups)
    .where(inArray(classGroups.id, ids));
  return new Map(groups.map((g) => [g.id, g.name]));
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const db = getDb();

  if (auth.user.role === 'teacher') {
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

    const groupNames = await resolveGroupNames([
      ...owned,
      ...coTaughtRows.map((r) => r.klass),
    ]);
    const groupNameFor = (row: ClassRow) =>
      row.groupId ? (groupNames.get(row.groupId) ?? null) : null;

    const ownedResults = owned.map((row) =>
      toClass(row, auth.user.name, { groupName: groupNameFor(row) }),
    );
    const coTaughtResults = coTaughtRows.map(({ klass, teacherName }) =>
      toClass(klass, teacherName, { groupName: groupNameFor(klass) }),
    );

    return NextResponse.json([...ownedResults, ...coTaughtResults]);
  }

  const rows = await db
    .select({ klass: classes, teacherName: users.name })
    .from(classMembers)
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .innerJoin(users, eq(classes.teacherId, users.id))
    .where(eq(classMembers.studentId, auth.user.id));

  return NextResponse.json(
    rows.map(({ klass, teacherName }) => toClass(klass, teacherName)),
  );
}
