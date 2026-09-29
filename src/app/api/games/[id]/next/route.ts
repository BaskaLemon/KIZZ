import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gamePlayers, gameSessions, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { loadGameState } from '@/lib/game';
import { awardPlacementPoints } from '@/lib/points/placement';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

// Host-only: advances past the current (revealed) question, or — on the
// last question — finishes the game and pays out placement points via the
// existing points ledger (no second scoring path).
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const db = getDb();
  const [session] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, id))
    .limit(1);
  if (!session) {
    return NextResponse.json({ error: 'Тоглоом олдсонгүй.' }, { status: 404 });
  }
  if (session.createdBy !== auth.user.id) {
    return NextResponse.json(
      { error: 'Зөвхөн тоглоомыг эхлүүлсэн хүн үргэлжлүүлэх боломжтой.' },
      { status: 403 },
    );
  }
  if (session.status !== 'active' || !session.revealed) {
    return NextResponse.json(
      { error: 'Эхлээд хариугаа харуулна уу.' },
      { status: 400 },
    );
  }

  const [quiz] = await db
    .select({ questions: quizzes.questions })
    .from(quizzes)
    .where(eq(quizzes.id, session.quizId))
    .limit(1);
  const totalQuestions = quiz?.questions.length ?? 0;
  const isLastQuestion = session.currentQuestionIndex + 1 >= totalQuestions;

  if (isLastQuestion) {
    const finalPlayers = await db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameSessionId, id))
      .orderBy(desc(gamePlayers.score));

    await awardPlacementPoints(
      id,
      finalPlayers.map((p, i) => ({ userId: p.userId, rank: i + 1, score: p.score })),
    );

    await db
      .update(gameSessions)
      .set({ status: 'finished' })
      .where(eq(gameSessions.id, id));
  } else {
    await db
      .update(gameSessions)
      .set({
        currentQuestionIndex: session.currentQuestionIndex + 1,
        questionStartedAt: new Date(),
        revealed: false,
      })
      .where(eq(gameSessions.id, id));
  }

  const state = await loadGameState(id, auth.user.id);
  return NextResponse.json(state);
}
