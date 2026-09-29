import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classGroups } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { toClassGroup } from '@/lib/mappers';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const rows = await getDb()
    .select()
    .from(classGroups)
    .where(eq(classGroups.teacherId, auth.user.id))
    .orderBy(asc(classGroups.name));

  return NextResponse.json(rows.map(toClassGroup));
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Зөвхөн багш бүлэг үүсгэх боломжтой.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { error: 'Бүлгийн нэрээ оруулна уу.' },
      { status: 400 },
    );
  }

  const [row] = await getDb()
    .insert(classGroups)
    .values({ teacherId: auth.user.id, name })
    .returning();

  return NextResponse.json(toClassGroup(row), { status: 201 });
}
