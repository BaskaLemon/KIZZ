import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classPostComments, classPosts } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { notifyUsers } from '@/lib/notifications';
import { MAX_COMMENT_LENGTH } from '@/lib/posts';
import { rateLimit } from '@/lib/rateLimit';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ postId: string }> };

/** Any group member can comment; the post's author is notified. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { postId } = await params;
  if (!isUuid(postId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const db = getDb();
  const [post] = await db.select().from(classPosts).where(eq(classPosts.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: 'Зарлал олдсонгүй.' }, { status: 404 });
  const { klass, isMember } = await getClassMembership(post.classId, auth.user.id);
  if (!klass || !isMember) return NextResponse.json({ error: 'Зарлал олдсонгүй.' }, { status: 404 });

  const limited = rateLimit(`comment:${auth.user.id}`, 30, 5 * 60_000);
  if (limited) return limited;

  const payload = await request.json().catch(() => null);
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  if (!body) return NextResponse.json({ error: 'Сэтгэгдлээ бичнэ үү.' }, { status: 400 });
  if (body.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Сэтгэгдэл ${MAX_COMMENT_LENGTH} тэмдэгтээс ихгүй байх ёстой.` },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(classPostComments)
    .values({ postId, authorId: auth.user.id, body })
    .returning();

  if (post.authorId !== auth.user.id) {
    await notifyUsers([post.authorId], {
      title: `💬 ${auth.user.name} таны зарлалд сэтгэгдэл бичлээ`,
      body: body.length > 80 ? `${body.slice(0, 80)}…` : body,
      href: `/classroom?classId=${post.classId}`,
    });
  }
  return NextResponse.json({ id: row.id }, { status: 201 });
}
