import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const limited = rateLimit(`password:${auth.user.id}`, 5, 10 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const current = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const next = typeof body?.newPassword === 'string' ? body.newPassword : '';
  if (next.length < 6) {
    return NextResponse.json(
      { error: 'Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна.' }, { status: 400 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(users.id, auth.user.id));
  return NextResponse.json({ ok: true });
}
