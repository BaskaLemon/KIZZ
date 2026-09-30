import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toPublicUser } from '@/lib/auth/session';

const MAX_NAME_LENGTH = 60;

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const patch: Partial<typeof users.$inferInsert> = {};

  if (body && 'name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Нэрээ оруулна уу.' }, { status: 400 });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Нэр ${MAX_NAME_LENGTH} тэмдэгтээс ихгүй байх ёстой.` },
        { status: 400 },
      );
    }
    patch.name = name;
  }
  if (body && 'showOnLeaderboard' in body) {
    if (typeof body.showOnLeaderboard !== 'boolean') {
      return NextResponse.json({ error: 'Буруу хүсэлт.' }, { status: 400 });
    }
    patch.showOnLeaderboard = body.showOnLeaderboard;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нэрээ оруулна уу.' }, { status: 400 });
  }

  const [row] = await getDb()
    .update(users)
    .set(patch)
    .where(eq(users.id, auth.user.id))
    .returning();
  return NextResponse.json(toPublicUser(row));
}
