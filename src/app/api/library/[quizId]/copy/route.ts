import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { notifyUsers } from '@/lib/notifications';
import { grantBadge } from '@/lib/points/badges';
import { rateLimit } from '@/lib/rateLimit';
import { toQuiz } from '@/lib/mappers';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ quizId: string }> };

/** Copy a public quiz into the caller's own quizzes. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { quizId } = await params;
  if (!isUuid(quizId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  const limited = rateLimit(`copy:${auth.user.id}`, 30, 10 * 60_000);
  if (limited) return limited;

  const db = getDb();
  const [source] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.isPublic, true)))
    .limit(1);
  if (!source || !source.ownerId) {
    return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
  }
  if (source.ownerId === auth.user.id) {
    return NextResponse.json({ error: 'Энэ бол таны өөрийн quiz.' }, { status: 400 });
  }

  const [already] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.ownerId, auth.user.id), eq(quizzes.copiedFromId, quizId)))
    .limit(1);
  if (already) {
    return NextResponse.json({ error: 'Та энэ quiz-ийг аль хэдийн хуулж авсан байна.' }, { status: 409 });
  }

  // Fresh question ids so the copy is fully independent of the original.
  const questions = source.questions.map((q) => ({ ...q, id: crypto.randomUUID() }));
  const copy = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(quizzes)
      .values({
        ownerId: auth.user.id,
        title: source.title,
        questions,
        generatedBy: source.generatedBy,
        copiedFromId: source.id,
      })
      .returning();
    await tx
      .update(quizzes)
      .set({ copyCount: sql`${quizzes.copyCount} + 1` })
      .where(eq(quizzes.id, source.id));
    return row;
  });

  await notifyUsers([source.ownerId], {
    title: `${auth.user.name} таны "${source.title}" quiz-ийг хуулж авлаа`,
    href: '/play',
  });
  if (source.copyCount + 1 >= 5) await grantBadge(db, source.ownerId, 'popular_author');

  return NextResponse.json(toQuiz(copy), { status: 201 });
}
