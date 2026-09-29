import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameAnswers, gamePlayers, gameSessions, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { ANSWER_WINDOW_MS, loadGameState } from '@/lib/game';
import { pgErrorCode, UNIQUE_VIOLATION } from '@/lib/dbErrors';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const optionIndex = typeof body?.optionIndex === 'number' ? body.optionIndex : -1;
  if (optionIndex < 0) {
    return NextResponse.json({ error: 'Хариулт сонгоно уу.' }, { status: 400 });
  }

  const db = getDb();

  const [session] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, id))
    .limit(1);
  if (!session || session.status !== 'active') {
    return NextResponse.json({ error: 'Тоглоом идэвхгүй байна.' }, { status: 400 });
  }

  const [player] = await db
    .select()
    .from(gamePlayers)
    .where(
      and(eq(gamePlayers.gameSessionId, id), eq(gamePlayers.userId, auth.user.id)),
    )
    .limit(1);
  if (!player) {
    return NextResponse.json(
      { error: 'Та энэ тоглоомд нэгдээгүй байна.' },
      { status: 403 },
    );
  }

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, session.quizId))
    .limit(1);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz олдсонгүй.' }, { status: 404 });
  }
  const question = quiz.questions[session.currentQuestionIndex];
  const isCorrect = optionIndex === question.correctIndex;

  const elapsedMs = session.questionStartedAt
    ? Date.now() - session.questionStartedAt.getTime()
    : ANSWER_WINDOW_MS;
  const remaining = Math.max(0, 1 - elapsedMs / ANSWER_WINDOW_MS);
  const pointsAwarded = isCorrect ? Math.round(500 + 500 * remaining) : 0;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(gameAnswers).values({
        gameSessionId: id,
        playerId: player.id,
        questionIndex: session.currentQuestionIndex,
        optionIndex,
        isCorrect,
        pointsAwarded,
      });
      await tx
        .update(gamePlayers)
        .set({
          score: player.score + pointsAwarded,
          streak: isCorrect ? player.streak + 1 : 0,
        })
        .where(eq(gamePlayers.id, player.id));
    });
  } catch (err) {
    if (pgErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: 'Та энэ асуултад хариулсан байна.' },
        { status: 409 },
      );
    }
    throw err;
  }

  const state = await loadGameState(id, auth.user.id);
  return NextResponse.json(state);
}
