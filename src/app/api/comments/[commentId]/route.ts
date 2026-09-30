import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classPostComments, classPosts } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ commentId: string }> };

/** The comment's author, or a group admin. */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { commentId } = await params;
  if (!isUuid(commentId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const db = getDb();
  const [row] = await db
    .select({ comment: classPostComments, classId: classPosts.classId })
    .from(classPostComments)
    .innerJoin(classPosts, eq(classPostComments.postId, classPosts.id))
    .where(eq(classPostComments.id, commentId))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const { isMember, isTeacher } = await getClassMembership(row.classId, auth.user.id);
  if (!isMember) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  if (!isTeacher && row.comment.authorId !== auth.user.id) {
    return NextResponse.json({ error: 'Сэтгэгдэл устгах эрхгүй байна.' }, { status: 403 });
  }
  await db.delete(classPostComments).where(eq(classPostComments.id, commentId));
  return NextResponse.json({ ok: true });
}
