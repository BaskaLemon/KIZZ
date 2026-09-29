import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/token';
import { toPublicUser } from '@/lib/auth/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role =
    body?.role === 'teacher' || body?.role === 'student' ? body.role : null;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: 'Бүх талбарыг бөглөнө үү.' },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой.' },
      { status: 400 },
    );
  }

  const dbClient = getDb();
  const [existing] = await dbClient
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'Энэ имэйл хаягаар бүртгэл үүссэн байна.' },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const [row] = await dbClient
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning();

  const token = await signToken(row.id);
  return NextResponse.json(
    { token, user: toPublicUser(row) },
    { status: 201 },
  );
}
