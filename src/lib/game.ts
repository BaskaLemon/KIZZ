import { and, count, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameAnswers, gamePlayers, gameSessions, quizzes, users } from '@/db/schema';
import type { GameState } from '@/lib/types';

/** Every "answer" route (join/start/answer/reveal/next) mutates one row and
 * then calls this to rebuild the client-facing snapshot, so there is a
 * single place that decides what's visible pre- vs post-reveal. */
export const ANSWER_WINDOW_MS = 20_000;

export async function loadGameState(
  gameSessionId: string,
  userId: string,
): Promise<GameState | null> {
  const db = getDb();

  const [session] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, gameSessionId))
    .limit(1);
  if (!session) return null;

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, session.quizId))
    .limit(1);
  if (!quiz) return null;

  const playerRows = await db
    .select({
      id: gamePlayers.id,
      userId: gamePlayers.userId,
      name: users.name,
      score: gamePlayers.score,
      avatarOptions: users.avatarOptions,
      equippedItemId: users.equippedItemId,
    })
    .from(gamePlayers)
    .innerJoin(users, eq(users.id, gamePlayers.userId))
    .where(eq(gamePlayers.gameSessionId, gameSessionId))
    .orderBy(desc(gamePlayers.score));

  const me = playerRows.find((p) => p.userId === userId);

  let myAnswer: number | null = null;
  if (me && session.status === 'active') {
    const [mine] = await db
      .select({ optionIndex: gameAnswers.optionIndex })
      .from(gameAnswers)
      .where(
        and(
          eq(gameAnswers.playerId, me.id),
          eq(gameAnswers.questionIndex, session.currentQuestionIndex),
        ),
      )
      .limit(1);
    myAnswer = mine ? mine.optionIndex : null;
  }

  let answeredCount = 0;
  let question: GameState['question'] = null;
  if (session.status === 'active') {
    const [{ value }] = await db
      .select({ value: count() })
      .from(gameAnswers)
      .where(
        and(
          eq(gameAnswers.gameSessionId, gameSessionId),
          eq(gameAnswers.questionIndex, session.currentQuestionIndex),
        ),
      );
    answeredCount = value;
    const q = quiz.questions[session.currentQuestionIndex];
    question = { prompt: q.prompt, options: q.options };
    if (session.revealed) {
      const answered = await db
        .select({ optionIndex: gameAnswers.optionIndex })
        .from(gameAnswers)
        .where(
          and(
            eq(gameAnswers.gameSessionId, gameSessionId),
            eq(gameAnswers.questionIndex, session.currentQuestionIndex),
          ),
        );
      const tally = q.options.map(
        (_, i) => answered.filter((a) => a.optionIndex === i).length,
      );
      question = { ...question, correctIndex: q.correctIndex, tally };
    }
  }

  return {
    id: session.id,
    code: session.code,
    status: session.status,
    isHost: session.createdBy === userId,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    questionStartedAt: session.questionStartedAt
      ? session.questionStartedAt.toISOString()
      : null,
    revealed: session.revealed,
    question,
    myAnswer,
    answeredCount,
    players: playerRows.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      score: p.score,
      avatarOptions: p.avatarOptions,
      equippedItemId: p.equippedItemId,
    })),
  };
}
