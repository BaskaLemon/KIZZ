import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classCoTeachers, classMembers } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { removeClassMember } from '@/lib/deletion';
import { notifyUsers } from '@/lib/notifications';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ classId: string; userId: string }> };

const notFound = () =>
  NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

/** Owner only: makes a member a co-admin (`{ admin: true }`) or turns a
 * co-admin back into a regular member (`{ admin: false }`). */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId, userId } = await params;
  if (!isUuid(classId) || !isUuid(userId)) return notFound();

  const { klass } = await getClassMembership(classId, auth.user.id);
  if (!klass) return notFound();
  if (klass.teacherId !== auth.user.id) {
    return NextResponse.json(
      { error: 'Зөвхөн бүлгийг үүсгэсэн хүн админ томилох боломжтой.' },
      { status: 403 },
    );
  }
  if (userId === klass.teacherId) {
    return NextResponse.json(
      { error: 'Үүсгэгчийн эрхийг өөрчлөх боломжгүй.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.admin !== 'boolean') {
    return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
  }

  const db = getDb();
  const target = await getClassMembership(classId, userId);
  if (!target.isMember) return notFound();

  if (body.admin && !target.isTeacher) {
    await db.transaction(async (tx) => {
      await tx
        .delete(classMembers)
        .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)));
      await tx.insert(classCoTeachers).values({ classId, teacherId: userId });
    });
    await notifyUsers([userId], {
      title: `Та "${klass.name}" бүлгийн админ боллоо`,
      href: `/classroom?classId=${classId}`,
    });
  } else if (!body.admin && target.isTeacher) {
    await db.transaction(async (tx) => {
      await tx
        .delete(classCoTeachers)
        .where(and(eq(classCoTeachers.classId, classId), eq(classCoTeachers.teacherId, userId)));
      await tx.insert(classMembers).values({ classId, studentId: userId });
    });
  }
  return NextResponse.json({ ok: true });
}

/** Admins remove a regular member; only the owner can remove a co-admin. */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId, userId } = await params;
  if (!isUuid(classId) || !isUuid(userId)) return notFound();

  const { klass, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass) return notFound();
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн бүлгийн админ гишүүн хасах боломжтой.' },
      { status: 403 },
    );
  }
  if (userId === klass.teacherId) {
    return NextResponse.json(
      { error: 'Үүсгэгчийг хасах боломжгүй.' },
      { status: 400 },
    );
  }

  const target = await getClassMembership(classId, userId);
  if (!target.isMember) return notFound();
  if (target.isTeacher && klass.teacherId !== auth.user.id) {
    return NextResponse.json(
      { error: 'Админыг зөвхөн бүлгийг үүсгэсэн хүн хасах боломжтой.' },
      { status: 403 },
    );
  }

  await removeClassMember(classId, userId);
  return NextResponse.json({ ok: true });
}
