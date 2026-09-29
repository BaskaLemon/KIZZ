import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isGroupMember } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { groupId } = await params;

  if (!(await isGroupMember(groupId, auth.user.id))) {
    return NextResponse.json(
      { error: 'Та энэ группын гишүүн биш байна.' },
      { status: 403 },
    );
  }

  const rows = await getDb()
    .select()
    .from(quizzes)
    .where(eq(quizzes.groupId, groupId))
    .orderBy(desc(quizzes.createdAt));

  return NextResponse.json(rows.map(toQuiz));
}
