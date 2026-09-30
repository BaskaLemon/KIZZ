import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notifications } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { isUuid } from '@/lib/uuid';

type Params = { params: Promise<{ id: string }> };

/** Mark one of the caller's notifications read. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const updated = await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, auth.user.id)))
    .returning({ id: notifications.id });
  if (updated.length === 0) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  const db = getDb();
  const [row] = await db
    .select({ id: notifications.id, dedupeKey: notifications.dedupeKey })
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, auth.user.id), isNull(notifications.dismissedAt)))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });

  if (row.dedupeKey) {
    // Keep a tombstone so the same reminder / level-up is not created again.
    await db
      .update(notifications)
      .set({ dismissedAt: new Date(), readAt: new Date() })
      .where(eq(notifications.id, id));
  } else {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
  return NextResponse.json({ ok: true });
}
