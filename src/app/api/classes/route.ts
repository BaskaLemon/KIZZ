import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { generateUniqueCode } from '@/lib/codes';
import { toClass } from '@/lib/mappers';
import { isClassColorKey, randomClassColor } from '@/lib/classColor';
import { optionalText } from '@/lib/text';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Зөвхөн багш анги үүсгэх боломжтой.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { error: 'Ангийн нэрээ оруулна уу.' },
      { status: 400 },
    );
  }
  const color = isClassColorKey(body?.color) ? body.color : randomClassColor();
  const section = optionalText(body?.section);
  const level = optionalText(body?.level);
  const subject = optionalText(body?.subject);
  const room = optionalText(body?.room);

  const db = getDb();
  const code = await generateUniqueCode(async (candidate) => {
    const [existing] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.code, candidate))
      .limit(1);
    return !existing;
  });

  const [row] = await db
    .insert(classes)
    .values({
      name,
      code,
      teacherId: auth.user.id,
      color,
      section,
      level,
      subject,
      room,
    })
    .returning();

  return NextResponse.json(toClass(row, auth.user.name), { status: 201 });
}
