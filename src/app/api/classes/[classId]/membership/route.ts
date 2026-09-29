import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { removeClassMember } from '@/lib/deletion';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ classId: string }> };

/** The caller leaves the group. Its owner can't — they delete it instead. */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;
  if (!isUuid(classId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const { klass, isMember } = await getClassMembership(classId, auth.user.id);
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });
  }
  if (klass.teacherId === auth.user.id) {
    return NextResponse.json(
      { error: 'Бүлгийг үүсгэсэн хүн гарах боломжгүй. Устгах боломжтой.' },
      { status: 400 },
    );
  }

  await removeClassMember(classId, auth.user.id);
  return NextResponse.json({ ok: true });
}
