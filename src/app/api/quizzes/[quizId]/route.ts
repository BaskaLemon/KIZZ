import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assignments, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessQuiz, getClassMembership } from '@/lib/access';
import { deleteGamesForQuizzes } from '@/lib/deletion';
import { toQuiz } from '@/lib/mappers';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ quizId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { quizId } = await params;
  if (!isUuid(quizId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const [quiz] = await getDb()
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);
  if (!quiz || !(await canAccessQuiz(quiz, auth.user.id))) {
    return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
  }

  return NextResponse.json(toQuiz(quiz));
}

/** Personal quizzes: the owner. Class quizzes: a class admin. A quiz that an
 * assignment still uses must be unlinked (assignment deleted) first. */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { quizId } = await params;
  if (!isUuid(quizId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const db = getDb();
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);
  if (!quiz || !(await canAccessQuiz(quiz, auth.user.id))) {
    return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
  }

  if (!quiz.ownerId) {
    const { isTeacher } = quiz.classId
      ? await getClassMembership(quiz.classId, auth.user.id)
      : { isTeacher: false };
    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Зөвхөн бүлгийн админ quiz устгах боломжтой.' },
        { status: 403 },
      );
    }
  }

  const [used] = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(eq(assignments.quizId, quizId))
    .limit(1);
  if (used) {
    return NextResponse.json(
      { error: 'Энэ quiz даалгаварт ашиглагдаж байна. Эхлээд даалгаврыг устгана уу.' },
      { status: 409 },
    );
  }

  await db.transaction(async (tx) => {
    await deleteGamesForQuizzes(tx, [quizId]);
    await tx.delete(quizzes).where(eq(quizzes.id, quizId));
  });
  return NextResponse.json({ ok: true });
}
