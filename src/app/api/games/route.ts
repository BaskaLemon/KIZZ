import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameSessions, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessQuiz } from '@/lib/access';
import { generateUniqueCode } from '@/lib/codes';
import { toGameSession } from '@/lib/mappers';

// Creates the DB record for a live game and hands back its join code. This
// only covers the REST surface — actually running a live match (players
// joining, scoring, a leaderboard) would need a stateful realtime server
// (see the comment in src/lib/socket.ts), which this app doesn't have yet.
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const quizId = typeof body?.quizId === 'string' ? body.quizId : '';
  if (!quizId) {
    return NextResponse.json({ error: 'Quiz сонгоно уу.' }, { status: 400 });
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

  const code = await generateUniqueCode(async (candidate) => {
    const [existing] = await db
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(eq(gameSessions.code, candidate))
      .limit(1);
    return !existing;
  });

  const [row] = await db
    .insert(gameSessions)
    .values({ code, quizId, createdBy: auth.user.id })
    .returning();

  return NextResponse.json(toGameSession(row), { status: 201 });
}
