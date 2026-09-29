import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { verifyPassword } from '@/lib/auth/password';
import { deleteUserCascade } from '@/lib/deletion';
import { rateLimit } from '@/lib/rateLimit';

/** Permanently deletes the caller's account. Requires the password. */
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const limited = rateLimit(`delete-account:${auth.user.id}`, 5, 10 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  const [row] = await getDb()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    return NextResponse.json({ error: 'Нууц үг буруу байна.' }, { status: 400 });
  }

  await deleteUserCascade(auth.user.id);
  return NextResponse.json({ ok: true });
}
