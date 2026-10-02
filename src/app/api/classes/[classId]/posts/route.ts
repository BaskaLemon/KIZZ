import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { classPosts } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { archivedGuard, getClassMembership } from '@/lib/access';
import { classStudentIds, notifyUsers } from '@/lib/notifications';
import { MAX_POST_LENGTH, loadPosts } from '@/lib/posts';
import { rateLimit } from '@/lib/rateLimit';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ classId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;
  if (!isUuid(classId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const { klass, isMember, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });
  return NextResponse.json(await loadPosts(classId, auth.user.id, isTeacher));
}

/** Admins post an announcement; members are notified. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;
  if (!isUuid(classId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const { klass, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass) return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн бүлгийн админ зарлал нийтлэх боломжтой.' },
      { status: 403 },
    );
  }
  const archived = archivedGuard(klass);
  if (archived) return archived;
  const limited = rateLimit(`post:${auth.user.id}`, 20, 10 * 60_000);
  if (limited) return limited;

  const payload = await request.json().catch(() => null);
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  if (!body) return NextResponse.json({ error: 'Зарлалын текстээ бичнэ үү.' }, { status: 400 });
  if (body.length > MAX_POST_LENGTH) {
    return NextResponse.json(
      { error: `Зарлал ${MAX_POST_LENGTH} тэмдэгтээс ихгүй байх ёстой.` },
      { status: 400 },
    );
  }

  await getDb().insert(classPosts).values({ classId, authorId: auth.user.id, body });
  await notifyUsers(await classStudentIds(classId), {
    title: `📣 ${klass.name}: шинэ зарлал`,
    body: body.length > 80 ? `${body.slice(0, 80)}…` : body,
    href: `/classroom?classId=${classId}`,
  });
  return NextResponse.json(await loadPosts(classId, auth.user.id, true), { status: 201 });
}
