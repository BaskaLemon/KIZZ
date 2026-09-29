import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';

type Params = { params: Promise<{ classId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

  const rows = await getDb()
    .select()
    .from(quizzes)
    .where(eq(quizzes.classId, classId))
    .orderBy(desc(quizzes.createdAt));

  return NextResponse.json(rows.map(toQuiz));
}
