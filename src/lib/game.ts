import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  gameAnswers,
  gamePlayers,
  gameResults,
  gameSessions,
  pointTransactions,
  quizzes,
  users,
} from '@/db/schema';
import { awardPlacementPoints } from '@/lib/points/placement';
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

  const onQuestion =
    session.status === 'active'
      ? and(
          eq(gameAnswers.gameSessionId, gameSessionId),
          eq(gameAnswers.questionIndex, session.currentQuestionIndex),
        )
      : undefined;

  // Independent reads run in parallel — this is the hot polling path.
  const [[quiz], playerRows, answers] = await Promise.all([
    db.select().from(quizzes).where(eq(quizzes.id, session.quizId)).limit(1),
    db
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
      .orderBy(desc(gamePlayers.score)),
    onQuestion
      ? db
          .select({
            playerId: gameAnswers.playerId,
            optionIndex: gameAnswers.optionIndex,
          })
          .from(gameAnswers)
          .where(onQuestion)
      : Promise.resolve([]),
  ]);
  if (!quiz) return null;

  const me = playerRows.find((p) => p.userId === userId);
  const myAnswer = me
    ? (answers.find((a) => a.playerId === me.id)?.optionIndex ?? null)
    : null;

  let myReward: GameState['myReward'] = null;
  if (session.status === 'finished' && me) {
    const [[result], [earned]] = await Promise.all([
      db
        .select({ rank: gameResults.rank, coins: gameResults.awardedPoints })
        .from(gameResults)
        .where(and(eq(gameResults.gameSessionId, gameSessionId), eq(gameResults.userId, userId)))
        .limit(1),
      db
        .select({ xp: sql<number>`coalesce(sum(${pointTransactions.xp}), 0)::int` })
        .from(pointTransactions)
        .where(
          and(
            eq(pointTransactions.userId, userId),
            eq(pointTransactions.type, 'quiz_placement'),
            eq(pointTransactions.referenceId, gameSessionId),
          ),
        ),
    ]);
    myReward = {
      rank: result?.rank ?? null,
      coins: result?.coins ?? 0,
      xp: earned?.xp ?? 0,
    };
  }

  const answeredCount = answers.length;
  let question: GameState['question'] = null;
  if (session.status === 'active') {
    const q = quiz.questions[session.currentQuestionIndex];
    question = { prompt: q.prompt, options: q.options };
    if (session.revealed) {
      const tally = q.options.map(
        (_, i) => answers.filter((a) => a.optionIndex === i).length,
      );
      question = { ...question, correctIndex: q.correctIndex, tally };
    }
  }

  return {
    id: session.id,
    code: session.code,
    status: session.status,
    isHost: session.createdBy === userId,
    hostUserId: session.createdBy,
    isPlayer: !!me,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    questionStartedAt: session.questionStartedAt
      ? session.questionStartedAt.toISOString()
      : null,
    serverNow: new Date().toISOString(),
    revealed: session.revealed,
    question,
    myAnswer,
    answeredCount,
    myReward,
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

/** Ends a game: ranks the real players by their recorded score, pays out
 * (see awardPlacementPoints for the anti-farming rules) and marks it
 * finished. Results are always computed here — never taken from a client. */
export async function finishGameSession(gameSessionId: string) {
  const db = getDb();
  const finalPlayers = await db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.gameSessionId, gameSessionId))
    .orderBy(desc(gamePlayers.score));

  const [session] = await db
    .select({ createdBy: gameSessions.createdBy })
    .from(gameSessions)
    .where(eq(gameSessions.id, gameSessionId))
    .limit(1);

  // The host may play along; they appear on the board but earn nothing and
  // don't count towards the minimum number of players.
  const results = await awardPlacementPoints(
    gameSessionId,
    finalPlayers.map((p, i) => ({ userId: p.userId, rank: i + 1, score: p.score })),
    session ? [session.createdBy] : [],
  );
  await db
    .update(gameSessions)
    .set({ status: 'finished' })
    .where(eq(gameSessions.id, gameSessionId));
  return results;
}
