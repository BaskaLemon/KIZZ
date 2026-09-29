import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classGroups } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';

type Params = { params: Promise<{ groupId: string }> };

// Deleting a group doesn't delete the classes in it — the DB foreign key is
// ON DELETE SET NULL, so they just become ungrouped.
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { groupId } = await params;

  const db = getDb();
  const [existing] = await db
    .select({ id: classGroups.id })
    .from(classGroups)
    .where(
      and(eq(classGroups.id, groupId), eq(classGroups.teacherId, auth.user.id)),
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });
  }

  await db.delete(classGroups).where(eq(classGroups.id, groupId));
  return NextResponse.json({ ok: true });
}
