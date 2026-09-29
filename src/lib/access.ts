import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  classCoTeachers,
  classes,
  classMembers,
  groupMembers,
  type ClassRow,
} from '@/db/schema';

export async function isGroupMember(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    )
    .limit(1);
  return !!row;
}

export interface ClassMembership {
  klass: ClassRow | null;
  isTeacher: boolean;
  isMember: boolean;
}

/** Loads a class and resolves whether `userId` may see it — as the primary
 * teacher, as a co-teacher who joined by code (full teacher permissions
 * everywhere this gates on `isTeacher`), or as a student who joined by
 * code. */
export async function getClassMembership(
  classId: string,
  userId: string,
): Promise<ClassMembership> {
  const db = getDb();
  const [klass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!klass) return { klass: null, isTeacher: false, isMember: false };
  if (klass.teacherId === userId) {
    return { klass, isTeacher: true, isMember: true };
  }

  const [coTeaching] = await db
    .select({ classId: classCoTeachers.classId })
    .from(classCoTeachers)
    .where(
      and(
        eq(classCoTeachers.classId, classId),
        eq(classCoTeachers.teacherId, userId),
      ),
    )
    .limit(1);
  if (coTeaching) {
    return { klass, isTeacher: true, isMember: true };
  }

  const [membership] = await db
    .select({ classId: classMembers.classId })
    .from(classMembers)
    .where(
      and(
        eq(classMembers.classId, classId),
        eq(classMembers.studentId, userId),
      ),
    )
    .limit(1);

  return { klass, isTeacher: false, isMember: !!membership };
}

/** A note or quiz belongs to exactly one of a study group or a class — this
 * checks whichever it has. Neither set (shouldn't happen) is denied. */
async function canAccessGroupOrClassScoped(
  row: { groupId: string | null; classId: string | null },
  userId: string,
): Promise<boolean> {
  if (row.classId) {
    const { isMember } = await getClassMembership(row.classId, userId);
    return isMember;
  }
  if (row.groupId) {
    return isGroupMember(row.groupId, userId);
  }
  return false;
}

export const canAccessNote = canAccessGroupOrClassScoped;
export const canAccessQuiz = canAccessGroupOrClassScoped;
