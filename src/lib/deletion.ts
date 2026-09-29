import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  assignments,
  classCoTeachers,
  classMaterials,
  classMembers,
  classes,
  gameAnswers,
  gamePlayers,
  gameResults,
  gameSessions,
  notes,
  quizzes,
  submissions,
} from '@/db/schema';

type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

/** Removes live-game history (answers, players, results, sessions) for the
 * given quizzes — a game can't outlive the quiz it was played from. */
export async function deleteGamesForQuizzes(tx: Tx, quizIds: string[]) {
  if (quizIds.length === 0) return;
  const sessions = await tx
    .select({ id: gameSessions.id })
    .from(gameSessions)
    .where(inArray(gameSessions.quizId, quizIds));
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length === 0) return;
  await tx.delete(gameAnswers).where(inArray(gameAnswers.gameSessionId, sessionIds));
  await tx.delete(gameResults).where(inArray(gameResults.gameSessionId, sessionIds));
  await tx.delete(gamePlayers).where(inArray(gamePlayers.gameSessionId, sessionIds));
  await tx.delete(gameSessions).where(inArray(gameSessions.id, sessionIds));
}

export async function deleteAssignmentCascade(assignmentId: string) {
  await getDb().transaction(async (tx) => {
    await tx.delete(submissions).where(eq(submissions.assignmentId, assignmentId));
    await tx.delete(assignments).where(eq(assignments.id, assignmentId));
  });
}

/** Deletes a whole class with everything inside it. */
export async function deleteClassCascade(classId: string) {
  await getDb().transaction(async (tx) => {
    const classAssignments = await tx
      .select({ id: assignments.id })
      .from(assignments)
      .where(eq(assignments.classId, classId));
    const assignmentIds = classAssignments.map((a) => a.id);
    if (assignmentIds.length > 0) {
      await tx.delete(submissions).where(inArray(submissions.assignmentId, assignmentIds));
      await tx.delete(assignments).where(inArray(assignments.id, assignmentIds));
    }

    const classQuizzes = await tx
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.classId, classId));
    const quizIds = classQuizzes.map((q) => q.id);
    await deleteGamesForQuizzes(tx, quizIds);
    if (quizIds.length > 0) {
      await tx.delete(quizzes).where(inArray(quizzes.id, quizIds));
    }

    // Note attachments cascade with their notes.
    await tx.delete(notes).where(eq(notes.classId, classId));
    await tx.delete(classMaterials).where(eq(classMaterials.classId, classId));
    await tx.delete(classMembers).where(eq(classMembers.classId, classId));
    await tx.delete(classCoTeachers).where(eq(classCoTeachers.classId, classId));
    await tx.delete(classes).where(eq(classes.id, classId));
  });
}

export async function removeClassMember(classId: string, userId: string) {
  const db = getDb();
  await db
    .delete(classMembers)
    .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)));
  await db
    .delete(classCoTeachers)
    .where(and(eq(classCoTeachers.classId, classId), eq(classCoTeachers.teacherId, userId)));
}
