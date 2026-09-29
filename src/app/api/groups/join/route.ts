import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { groupMembers, groups } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isGroupMember } from '@/lib/access';
import { toGroup } from '@/lib/mappers';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const code =
    typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) {
    return NextResponse.json(
      { error: 'Группын кодоо оруулна уу.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, code))
    .limit(1);
  if (!group) {
    return NextResponse.json({ error: 'Код буруу байна.' }, { status: 404 });
  }

  if (!(await isGroupMember(group.id, auth.user.id))) {
    await db
      .insert(groupMembers)
      .values({ groupId: group.id, userId: auth.user.id });
  }

  return NextResponse.json(toGroup(group));
}
