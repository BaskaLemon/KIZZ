import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quizzes, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';

const LIMIT = 30;

/** The public quiz library: quizzes their owners chose to share. Optional
 * `?q=` searches titles; `?sort=popular` orders by copies (default: newest). */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
  const popular = url.searchParams.get('sort') === 'popular';

  const rows = await getDb()
    .select({
      id: quizzes.id,
      title: quizzes.title,
      questions: quizzes.questions,
      copyCount: quizzes.copyCount,
      publishedAt: quizzes.publishedAt,
      ownerId: quizzes.ownerId,
      authorName: users.name,
    })
    .from(quizzes)
    .innerJoin(users, eq(quizzes.ownerId, users.id))
    .where(
      and(
        eq(quizzes.isPublic, true),
        // % and _ in the search text are literals, not wildcards
        q ? ilike(quizzes.title, `%${q.replace(/[\\%_]/g, '\\$&')}%`) : undefined,
      ),
    )
    .orderBy(popular ? desc(quizzes.copyCount) : desc(quizzes.publishedAt), desc(quizzes.publishedAt))
    .limit(LIMIT);

  // Which of these the caller already copied (a copy points back at its source).
  const copied = await getDb()
    .select({ from: quizzes.copiedFromId })
    .from(quizzes)
    .where(and(eq(quizzes.ownerId, auth.user.id), sql`${quizzes.copiedFromId} is not null`));
  const copiedIds = new Set(copied.map((c) => c.from));

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      questionCount: r.questions.length,
      copyCount: r.copyCount,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      authorName: r.authorName,
      // A short teaser (no answers) so people can judge it before copying.
      sample: r.questions.slice(0, 2).map((qn) => qn.prompt),
      mine: r.ownerId === auth.user.id,
      copied: copiedIds.has(r.id),
    })),
  });
}
