import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/token';
import { toPublicUser } from '@/lib/auth/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Имэйл, нууц үгээ оруулна уу.' },
      { status: 400 },
    );
  }

  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const valid = row ? await verifyPassword(password, row.passwordHash) : false;

  if (!row || !valid) {
    return NextResponse.json(
      { error: 'Имэйл эсвэл нууц үг буруу байна.' },
      { status: 401 },
    );
  }

  const token = await signToken(row.id);
  return NextResponse.json({ token, user: toPublicUser(row) });
}
