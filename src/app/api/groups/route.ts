import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { groupMembers, groups } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { generateUniqueCode } from '@/lib/codes';
import { toGroup } from '@/lib/mappers';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { error: 'Группын нэрээ оруулна уу.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const code = await generateUniqueCode(async (candidate) => {
    const [existing] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.code, candidate))
      .limit(1);
    return !existing;
  });

  const [row] = await db
    .insert(groups)
    .values({ name, code, createdBy: auth.user.id })
    .returning();
  await db.insert(groupMembers).values({ groupId: row.id, userId: auth.user.id });

  return NextResponse.json(toGroup(row), { status: 201 });
}
