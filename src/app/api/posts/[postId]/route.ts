import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classPosts } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ postId: string }> };

async function loadForAdmin(request: Request, params: Params['params']) {
  const auth = await requireUser(request);
  if (auth.error) return { error: auth.error } as const;
  const { postId } = await params;
  if (!isUuid(postId)) return { error: NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 }) } as const;

  const [post] = await getDb().select().from(classPosts).where(eq(classPosts.id, postId)).limit(1);
  if (!post) return { error: NextResponse.json({ error: 'Зарлал олдсонгүй.' }, { status: 404 }) } as const;
  const { isMember, isTeacher } = await getClassMembership(post.classId, auth.user.id);
  if (!isMember) return { error: NextResponse.json({ error: 'Зарлал олдсонгүй.' }, { status: 404 }) } as const;
  return { auth, post, isTeacher } as const;
}

/** Pin or unpin (admins). */
export async function PATCH(request: Request, { params }: Params) {
  const r = await loadForAdmin(request, params);
  if ('error' in r) return r.error;
  if (!r.isTeacher) {
    return NextResponse.json({ error: 'Зөвхөн бүлгийн админ зарлал бэхлэх боломжтой.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.pinned !== 'boolean') {
    return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
  }
  await getDb().update(classPosts).set({ pinned: body.pinned }).where(eq(classPosts.id, r.post.id));
  return NextResponse.json({ ok: true });
}

/** Admins, or the post's own author. Its comments go with it. */
export async function DELETE(request: Request, { params }: Params) {
  const r = await loadForAdmin(request, params);
  if ('error' in r) return r.error;
  if (!r.isTeacher && r.post.authorId !== r.auth.user.id) {
    return NextResponse.json({ error: 'Зарлал устгах эрхгүй байна.' }, { status: 403 });
  }
  await getDb().delete(classPosts).where(eq(classPosts.id, r.post.id));
  return NextResponse.json({ ok: true });
}
