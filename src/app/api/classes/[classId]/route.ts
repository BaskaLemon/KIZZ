import { NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classGroups, classMembers, classes, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { toClass } from '@/lib/mappers';
import { isClassColorKey } from '@/lib/classColor';
import { optionalText } from '@/lib/text';

type Params = { params: Promise<{ classId: string }> };

async function resolveGroupName(
  groupId: string | null,
): Promise<string | null> {
  if (!groupId) return null;
  const [group] = await getDb()
    .select({ name: classGroups.name })
    .from(classGroups)
    .where(eq(classGroups.id, groupId))
    .limit(1);
  return group?.name ?? null;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isMember, isTeacher } = await getClassMembership(
    classId,
    auth.user.id,
  );
  if (!klass || !isMember) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }

  const db = getDb();
  const teacherName = isTeacher
    ? auth.user.name
    : ((
        await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, klass.teacherId))
          .limit(1)
      )[0]?.name ?? '');

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(classMembers)
    .where(eq(classMembers.classId, classId));

  const groupName = await resolveGroupName(klass.groupId);

  return NextResponse.json(toClass(klass, teacherName, { memberCount, groupName }));
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { classId } = await params;

  const { klass, isTeacher } = await getClassMembership(classId, auth.user.id);
  if (!klass) {
    return NextResponse.json({ error: 'Анги олдсонгүй.' }, { status: 404 });
  }
  if (!isTeacher) {
    return NextResponse.json(
      { error: 'Зөвхөн ангийн багш засах боломжтой.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
  }

  const db = getDb();
  const patch: Partial<typeof classes.$inferInsert> = {};

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { error: 'Ангийн нэрээ оруулна уу.' },
        { status: 400 },
      );
    }
    patch.name = name;
  }
  if ('color' in body) {
    if (!isClassColorKey(body.color)) {
      return NextResponse.json({ error: 'Өнгө буруу байна.' }, { status: 400 });
    }
    patch.color = body.color;
  }
  if ('section' in body) patch.section = optionalText(body.section);
  if ('level' in body) patch.level = optionalText(body.level);
  if ('subject' in body) patch.subject = optionalText(body.subject);
  if ('room' in body) patch.room = optionalText(body.room);
  if ('groupId' in body) {
    if (body.groupId === null || body.groupId === '') {
      patch.groupId = null;
    } else if (typeof body.groupId === 'string') {
      // Only a group the requesting user created can be assigned — groups
      // are per-teacher, not shared, even between co-teachers of this class.
      const [owned] = await db
        .select({ id: classGroups.id })
        .from(classGroups)
        .where(
          and(
            eq(classGroups.id, body.groupId),
            eq(classGroups.teacherId, auth.user.id),
          ),
        )
        .limit(1);
      if (!owned) {
        return NextResponse.json(
          { error: 'Бүлэг олдсонгүй.' },
          { status: 400 },
        );
      }
      patch.groupId = body.groupId;
    }
  }

  const [row] =
    Object.keys(patch).length === 0
      ? [klass]
      : await db
          .update(classes)
          .set(patch)
          .where(eq(classes.id, classId))
          .returning();

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(classMembers)
    .where(eq(classMembers.classId, classId));

  const groupName = await resolveGroupName(row.groupId);

  return NextResponse.json(
    toClass(row, auth.user.name, { memberCount, groupName }),
  );
}
