import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessQuiz } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';

type Params = { params: Promise<{ quizId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { quizId } = await params;

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
